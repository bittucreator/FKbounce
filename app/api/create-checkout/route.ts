import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, billingCycle } = await req.json();

    if (!plan || !billingCycle) {
      return NextResponse.json({ error: 'Missing plan or billing cycle' }, { status: 400 });
    }

    // Get the appropriate price ID based on billing cycle
    const priceId = billingCycle === 'yearly' 
      ? process.env.DODO_PRICE_ID_YEARLY 
      : process.env.DODO_PRICE_ID_MONTHLY;

    const checkoutData = {
      price_id: priceId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/cancel`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        plan: plan,
        billing_cycle: billingCycle,
      },
    };

    const apiUrl = process.env.DODO_API_MODE === 'live' 
      ? 'https://live.dodopayments.com'
      : 'https://test.dodopayments.com';

    const response = await fetch(`${apiUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DODO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Dodo Payments error:', error);
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    const checkout = await response.json();

    return NextResponse.json({ 
      checkoutUrl: checkout.checkout_url,
      checkoutId: checkout.id 
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
