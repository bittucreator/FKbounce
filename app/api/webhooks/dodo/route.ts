import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Create a service role client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('x-dodo-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      payload,
      signature,
      process.env.DODO_WEBHOOK_SECRET!
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);
    console.log('Received event:', event);

    // Handle successful payment
    if (event.type === 'checkout.completed') {
      const { metadata, customer_id, subscription_id } = event.data;
      const { user_id, plan, billing_cycle } = metadata;

      if (!user_id || !plan || !billing_cycle) {
        console.error('Missing metadata in webhook:', metadata);
        return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 });
      }

      // Calculate plan expiration date
      const now = new Date();
      const expiresAt = new Date(now);
      const periodEnd = new Date(now);
      
      if (billing_cycle === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Create or update subscription record
      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id,
          dodo_customer_id: customer_id,
          dodo_subscription_id: subscription_id,
          dodo_checkout_id: event.data.id,
          status: 'active',
          plan: 'pro',
          billing_cycle,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (subError) {
        console.error('Error creating subscription:', subError);
        return NextResponse.json({ error: 'Subscription creation failed' }, { status: 500 });
      }

      // Update user plan in database
      const { error } = await supabaseAdmin
        .from('user_plans')
        .upsert({
          user_id,
          plan: 'pro',
          verifications_limit: 1000000,
          verifications_used: 0,
          billing_cycle,
          plan_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error updating user plan:', error);
        console.log('Upsert payload:', {
          user_id,
          plan: 'pro',
          verifications_limit: 1000000,
          verifications_used: 0,
          billing_cycle,
          plan_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        });
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log(`Successfully upgraded user ${user_id} to ${plan} plan (${billing_cycle})`);
    }

    // Handle subscription cancellation
    if (event.type === 'subscription.cancelled') {
      const { subscription_id } = event.data;

      if (!subscription_id) {
        console.error('Missing subscription_id in webhook');
        return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
      }

      // Get subscription to find user_id
      const { data: subscription, error: fetchError } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('dodo_subscription_id', subscription_id)
        .single();

      if (fetchError || !subscription) {
        console.error('Subscription not found:', subscription_id);
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
      }

      const user_id = subscription.user_id;

      // Update subscription status
      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('dodo_subscription_id', subscription_id);

      if (subError) {
        console.error('Error updating subscription:', subError);
        return NextResponse.json({ error: 'Subscription update failed' }, { status: 500 });
      }

      // Downgrade to free plan
      const { error } = await supabaseAdmin
        .from('user_plans')
        .upsert({
          user_id,
          plan: 'free',
          verifications_limit: 500,
          verifications_used: 0,
          billing_cycle: 'monthly',
          plan_expires_at: null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error downgrading user plan:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log(`Successfully downgraded user ${user_id} to free plan`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
