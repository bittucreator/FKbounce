import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { rateLimit, rateLimitConfigs } from '@/lib/ratelimit';

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
  try {
    // Remove the 'whsec_' prefix and decode from base64
    const base64Secret = secret.startsWith('whsec_') ? secret.substring(6) : secret;
    const decodedSecret = Buffer.from(base64Secret, 'base64');
    
    console.log('Base64 secret length:', base64Secret.length);
    console.log('Decoded secret length:', decodedSecret.length);
    
    const hmac = crypto.createHmac('sha256', decodedSecret);
    const digest = hmac.update(payload, 'utf8').digest('base64');
    
    console.log('Computed digest:', digest);
    console.log('Received signature:', signature);
    console.log('Signatures match:', digest === signature);
    
    // Use simple comparison first
    if (digest === signature) {
      return true;
    }
    
    // Fallback to timing-safe comparison if lengths match
    if (signature.length === digest.length) {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    }
    
    console.log('Length mismatch:', { signatureLength: signature.length, digestLength: digest.length });
    return false;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting for webhook - 100 requests per minute
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await rateLimit(
      `webhook:${ip}`,
      rateLimitConfigs.webhook
    )

    if (!rateLimitResult.success) {
      console.error('Webhook rate limit exceeded for IP:', ip)
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const payload = await req.text();
    const webhookId = req.headers.get('webhook-id');
    const webhookTimestamp = req.headers.get('webhook-timestamp');
    const webhookSignature = req.headers.get('webhook-signature');

    console.log('Webhook headers:', { webhookId, webhookTimestamp, webhookSignature });

    if (!webhookSignature || !webhookId || !webhookTimestamp) {
      console.error('Missing webhook headers:', { webhookSignature, webhookId, webhookTimestamp });
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Extract signature from versioned format (v1,<signature>)
    const signatureParts = webhookSignature.split(',');
    const signature = signatureParts.length > 1 ? signatureParts[1] : webhookSignature;

    console.log('Extracted signature:', signature);
    console.log('Webhook secret (first 10 chars):', process.env.DODO_WEBHOOK_SECRET?.substring(0, 10));

    // Create signed content: webhook-id.webhook-timestamp.payload
    const signedContent = `${webhookId}.${webhookTimestamp}.${payload}`;
    
    console.log('Signed content length:', signedContent.length);
    console.log('Signed content preview:', signedContent.substring(0, 100));

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      signedContent,
      signature,
      process.env.DODO_WEBHOOK_SECRET!
    );

    if (!isValid) {
      console.error('Invalid signature. Expected format: webhook-id.webhook-timestamp.payload');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);
    console.log('Received event:', event);

    // Handle successful payment or active subscription
    if (event.type === 'subscription.active' || event.type === 'checkout.completed') {
      const { metadata, customer, subscription_id, status, next_billing_date, created_at } = event.data;
      const { user_id, plan, billing_cycle } = metadata;

      if (!user_id || !plan || !billing_cycle) {
        console.error('Missing metadata in webhook:', metadata);
        return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 });
      }

      // Parse dates from Dodo's format
      const currentPeriodStart = new Date(created_at || event.timestamp);
      const currentPeriodEnd = new Date(next_billing_date);
      const expiresAt = new Date(next_billing_date);

      // Create or update subscription record
      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id,
          dodo_customer_id: customer.customer_id,
          dodo_subscription_id: subscription_id,
          dodo_checkout_id: subscription_id, // Using subscription_id as checkout may not be present
          status: status || 'active',
          plan: 'pro',
          billing_cycle,
          current_period_start: currentPeriodStart.toISOString(),
          current_period_end: currentPeriodEnd.toISOString(),
          cancel_at_period_end: event.data.cancel_at_next_billing_date || false,
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
