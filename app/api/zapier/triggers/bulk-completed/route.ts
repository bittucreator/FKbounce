import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// GET /api/zapier/triggers/bulk-completed - Poll for completed bulk jobs
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    // Validate API key and get user
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: apiKeyData, error: apiKeyError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id')
      .eq('key', apiKey)
      .single()

    if (apiKeyError || !apiKeyData) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get recently completed jobs
    const { data: jobs, error } = await supabaseAdmin
      .from('verification_jobs')
      .select('*')
      .eq('user_id', apiKeyData.user_id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    // Format for Zapier
    const formattedResults = (jobs || []).map((job) => ({
      id: job.id,
      status: job.status,
      totalEmails: job.total_emails,
      processedEmails: job.processed_emails,
      validEmails: job.valid_count || 0,
      invalidEmails: job.invalid_count || 0,
      startedAt: job.created_at,
      completedAt: job.completed_at,
    }))

    return NextResponse.json(formattedResults)
  } catch (error) {
    console.error('Zapier bulk trigger error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bulk jobs' },
      { status: 500 }
    )
  }
}
