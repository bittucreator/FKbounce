import { createClient } from '/Users/bittu/Email-verifier/lib/supabase/server.ts'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user plan
    let { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If no plan exists, create default free plan
    if (planError || !userPlan) {
      const { data: newPlan, error: createError } = await supabase
        .from('user_plans')
        .insert({
          user_id: user.id,
          plan: 'free',
          verifications_used: 0,
          verifications_limit: 500,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating plan:', createError)
        return NextResponse.json(
          { error: 'Failed to create user plan' },
          { status: 500 }
        )
      }

      userPlan = newPlan
    }

    const remaining = userPlan.verifications_limit - userPlan.verifications_used

    return NextResponse.json({
      plan: userPlan.plan,
      used: userPlan.verifications_used,
      limit: userPlan.verifications_limit,
      remaining: Math.max(0, remaining),
      canVerify: remaining > 0,
    })
  } catch (error) {
    console.error('Check limit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
