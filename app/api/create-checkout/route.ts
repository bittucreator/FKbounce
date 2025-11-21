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

    // Get the appropriate product ID based on billing cycle
    const productId = billingCycle === 'yearly' 
      ? process.env.DODO_PRICE_ID_YEARLY 
      : process.env.DODO_PRICE_ID_MONTHLY;

    const checkoutData = {
      product_cart: [
        {
          product_id: productId,
          quantity: 1
        }
      ],
      customer: {
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0]
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success`,
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

    const responseText = await response.text();
    console.log('=== DODO PAYMENTS DEBUG ===');
    console.log('Status:', response.status);
    console.log('Response:', responseText);
    console.log('API URL:', apiUrl);
    console.log('Product ID:', productId);
    console.log('===========================');

    if (!response.ok) {
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch {
        errorDetails = { message: responseText || 'Unknown error' };
      }
      console.error('Dodo Payments error:', errorDetails);
      console.error('Status:', response.status);
      console.error('Request data:', JSON.stringify(checkoutData, null, 2));
      return NextResponse.json({ 
        error: 'Failed to create checkout session',
        details: errorDetails,
        status: response.status 
      }, { status: 500 });
    }

    const checkout = JSON.parse(responseText);

    return NextResponse.json({ 
      checkoutUrl: checkout.checkout_url,
      sessionId: checkout.session_id 
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
