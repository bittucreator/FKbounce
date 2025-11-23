import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/analytics - Get API usage analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d

    let daysAgo = 30
    if (period === '7d') daysAgo = 7
    if (period === '90d') daysAgo = 90

    // Get user plan info
    const { data: userPlan } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get verification history for the period
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    const { data: history } = await supabase
      .from('verification_history')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    // Calculate statistics
    const totalVerifications = history?.reduce((sum, h) => sum + (h.email_count || 0), 0) || 0
    const totalValid = history?.reduce((sum, h) => sum + (h.valid_count || 0), 0) || 0
    const totalInvalid = history?.reduce((sum, h) => sum + (h.invalid_count || 0), 0) || 0

    // Group by date for trend chart
    const dailyStats: Record<string, { date: string; verifications: number; valid: number; invalid: number }> = {}
    
    history?.forEach(h => {
      const date = new Date(h.created_at).toISOString().split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = { date, verifications: 0, valid: 0, invalid: 0 }
      }
      dailyStats[date].verifications += h.email_count || 0
      dailyStats[date].valid += h.valid_count || 0
      dailyStats[date].invalid += h.invalid_count || 0
    })

    const dailyTrend = Object.values(dailyStats)

    // Verification type breakdown
    const singleVerifications = history?.filter(h => h.verification_type === 'single').length || 0
    const bulkVerifications = history?.filter(h => h.verification_type === 'bulk').length || 0

    // Calculate average valid rate
    const validRate = totalVerifications > 0 
      ? Math.round((totalValid / totalVerifications) * 100) 
      : 0

    // Get API keys count
    const { count: apiKeysCount } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Get webhook configs count
    const { count: webhooksCount } = await supabase
      .from('webhook_configs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Recent verification jobs
    const { data: recentJobs } = await supabase
      .from('verification_jobs')
      .select('id, status, total_emails, processed_emails, created_at, completed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      period,
      plan: {
        type: userPlan?.plan || 'free',
        verifications_used: userPlan?.verifications_used || 0,
        verifications_limit: userPlan?.verifications_limit || 500,
        usage_percentage: Math.round(((userPlan?.verifications_used || 0) / (userPlan?.verifications_limit || 500)) * 100),
      },
      summary: {
        total_verifications: totalVerifications,
        total_valid: totalValid,
        total_invalid: totalInvalid,
        valid_rate: validRate,
        single_verifications: singleVerifications,
        bulk_verifications: bulkVerifications,
        active_api_keys: apiKeysCount || 0,
        active_webhooks: webhooksCount || 0,
      },
      daily_trend: dailyTrend,
      recent_jobs: recentJobs || [],
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
