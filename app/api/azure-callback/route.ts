import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deliverWebhook, WebhookPayload } from '@/lib/webhook-delivery'

interface AzureCallbackPayload {
  jobId: string
  userId: string
  status: 'completed' | 'failed'
  total: number
  valid: number
  invalid: number
  results: any[]
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify request is from Azure
    const azureWorkerHeader = request.headers.get('X-Azure-Worker')
    if (azureWorkerHeader !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload: AzureCallbackPayload = await request.json()
    const { jobId, userId, status, total, valid, invalid, results, error } = payload

    const supabase = await createClient()

    // Update verification job in database
    await supabase
      .from('verification_jobs')
      .update({
        status,
        processed_emails: total,
        valid_count: valid,
        invalid_count: invalid,
        progress_percentage: 100,
        results: status === 'completed' ? results : null,
        error_message: error,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('user_id', userId)

    // Save to verification history
    if (status === 'completed') {
      await supabase.from('verification_history').insert({
        user_id: userId,
        verification_type: 'bulk',
        email_count: total,
        valid_count: valid,
        invalid_count: invalid,
        results: results,
      })

      // Update user plan usage
      const { data: userPlan } = await supabase
        .from('user_plans')
        .select('verifications_used')
        .eq('user_id', userId)
        .single()

      await supabase
        .from('user_plans')
        .update({
          verifications_used: (userPlan?.verifications_used || 0) + total,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    }

    // Trigger webhooks
    const { data: webhooks } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (webhooks && webhooks.length > 0) {
      const webhookPayload: WebhookPayload = {
        event: 'bulk_verification_complete',
        job_id: jobId,
        timestamp: new Date().toISOString(),
        data: {
          total,
          valid,
          invalid,
          status,
          processed_by: 'azure_worker',
        },
      }

      for (const webhook of webhooks) {
        deliverWebhook(webhook, webhookPayload).then(async (result) => {
          await supabase.from('webhook_deliveries').insert({
            webhook_config_id: webhook.id,
            verification_job_id: jobId,
            event_type: webhookPayload.event,
            payload: webhookPayload,
            status: result.success ? 'success' : 'failed',
            response_code: result.statusCode,
            response_body: result.responseBody,
            delivered_at: result.success ? new Date().toISOString() : null,
          })
        }).catch(console.error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Azure callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
