import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscriptionId } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 })
    }

    // Call Dodo Payments API to cancel subscription
    const dodoResponse = await fetch(
      `https://api.dodopayments.com/v1/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DODO_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!dodoResponse.ok) {
      const errorData = await dodoResponse.text()
      console.error('Dodo API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to cancel subscription with payment provider' },
        { status: 500 }
      )
    }

    // The webhook will handle updating the database
    // Just return success here
    return NextResponse.json({ 
      success: true,
      message: 'Subscription cancelled successfully. You will retain access until the end of your billing period.'
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
