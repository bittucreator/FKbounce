import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/verify-bulk-job/:jobId - Check bulk verification job status
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const jobId = params.jobId

    const { data: job, error } = await supabase
      .from('verification_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }
      throw error
    }

    // Calculate estimated time remaining if still processing
    let estimatedTimeRemaining = null
    if (job.status === 'processing' && job.processed_emails > 0) {
      const elapsedTime = new Date().getTime() - new Date(job.created_at).getTime()
      const emailsPerMs = job.processed_emails / elapsedTime
      const remainingEmails = job.total_emails - job.processed_emails
      estimatedTimeRemaining = Math.round(remainingEmails / emailsPerMs / 1000) // in seconds
    }

    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        total_emails: job.total_emails,
        processed_emails: job.processed_emails,
        valid_count: job.valid_count,
        invalid_count: job.invalid_count,
        progress_percentage: job.progress_percentage,
        error_message: job.error_message,
        created_at: job.created_at,
        updated_at: job.updated_at,
        completed_at: job.completed_at,
        estimated_time_remaining: estimatedTimeRemaining,
      },
      results: job.status === 'completed' ? job.results : null,
    })
  } catch (error) {
    console.error('Error fetching job status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    )
  }
}
