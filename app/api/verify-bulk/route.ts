import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns'
import { promisify } from 'util'
import emailValidator from 'email-validator'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, rateLimitConfigs } from '@/lib/ratelimit'
import { dnsCache } from '@/lib/dns-cache'
import { deliverWebhook, WebhookPayload } from '@/lib/webhook-delivery'
import { sendBatchProgressWebhook, sendBatchWebhook, sendQuotaWarningWebhook, sendQuotaExceededWebhook } from '@/lib/webhooks/delivery'
import { verifyEmailsParallel, estimateVerificationTime } from '@/lib/parallel-verifier'
import { analyzeEmailIntelligence } from '@/lib/email-intelligence'
// @ts-ignore
import disposableDomains from 'disposable-email-domains'

const resolveMx = promisify(dns.resolveMx)

interface VerificationResult {
  email: string
  valid: boolean
  syntax: boolean
  dns: boolean
  smtp: boolean
  disposable: boolean
  catch_all: boolean
  message: string
  // SMTP Provider
  smtp_provider?: string
  smtp_provider_type?: 'enterprise' | 'business' | 'personal' | 'unknown'
  // Confidence level
  confidence_level?: number
  confidence_reasons?: string[]
  // Advanced intelligence
  reputation_score?: number
  is_spam_trap?: boolean
  is_role_based?: boolean
  role_type?: string
  email_age?: string
  domain_health_score?: number
  inbox_placement_score?: number
  mx_priority?: number[]
  insights?: string[]
  // SPF/DMARC
  has_spf?: boolean
  has_dmarc?: boolean
  spf_record?: string
  dmarc_policy?: string
}

interface BulkVerificationResponse {
  total: number
  unique: number
  duplicates: number
  duplicateEmails: string[]
  valid: number
  invalid: number
  results: VerificationResult[]
}

function isDisposable(domain: string): boolean {
  return disposableDomains.includes(domain.toLowerCase())
}

export async function POST(request: NextRequest) {
  console.log('[verify-bulk] POST called')
  console.log('[verify-bulk] SMTP_SERVICE_URL:', process.env.SMTP_SERVICE_URL || 'NOT SET')
  console.log('[verify-bulk] SMTP_SERVICE_API_KEY:', process.env.SMTP_SERVICE_API_KEY ? 'SET' : 'NOT SET')
  
  try {
    const body = await request.json()
    const { emails, stream } = body
    
    console.log('[verify-bulk] Emails count:', emails?.length, 'Stream:', stream)

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Emails array is required' },
        { status: 400 }
      )
    }

    // Check user authentication and limits
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get or create user plan first to determine rate limit
    let { data: userPlan } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!userPlan) {
      const { data: newPlan } = await supabase
        .from('user_plans')
        .insert({
          user_id: user.id,
          plan: 'free',
          verifications_used: 0,
          verifications_limit: 500,
        })
        .select()
        .single()
      userPlan = newPlan
    }

    // Apply rate limiting based on user plan
    // Free: 120 req/min, Pro: 600 req/min
    const rateConfig = userPlan?.plan === 'pro' 
      ? rateLimitConfigs.apiPro 
      : rateLimitConfigs.apiFree

    const rateLimitResult = await rateLimit(
      `verify-bulk:${user.id}`,
      rateConfig
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      )
    }

    // Check plan limits
    const remaining = (userPlan?.verifications_limit || 500) - (userPlan?.verifications_used || 0)
    
    if (remaining <= 0) {
      return NextResponse.json(
        { error: 'Verification limit reached. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    if (emails.length > remaining) {
      return NextResponse.json(
        { error: `Not enough verifications remaining. You have ${remaining} verifications left.` },
        { status: 403 }
      )
    }

    // Enforce maximum based on plan
    const maxAllowed = userPlan?.plan === 'pro' ? 1000000 : 500
    if (emails.length > maxAllowed) {
      return NextResponse.json(
        { error: `Maximum ${maxAllowed.toLocaleString()} emails allowed per request for your plan` },
        { status: 400 }
      )
    }

    // Detect duplicates in current batch
    const emailSet = new Set<string>()
    const duplicates: string[] = []
    const uniqueEmails: string[] = []
    
    emails.forEach((email: string) => {
      const normalizedEmail = email.toLowerCase().trim()
      if (emailSet.has(normalizedEmail)) {
        duplicates.push(email)
      } else {
        emailSet.add(normalizedEmail)
        uniqueEmails.push(email)
      }
    })

    // If streaming is enabled, use SSE for real-time progress
    if (stream) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          const startTime = Date.now()
          let processedCount = 0
          let validCount = 0
          let invalidCount = 0

          // Create verification job
          const { data: job } = await supabase
            .from('verification_jobs')
            .insert({
              user_id: user.id,
              status: 'processing',
              total_emails: uniqueEmails.length,
              processed_emails: 0,
              valid_count: 0,
              invalid_count: 0,
              progress_percentage: 0,
            })
            .select()
            .single()

          const jobId = job?.id

          // Determine concurrency based on plan (free: 200, pro: 2000)
          // Allow override from request body with validation
          let concurrency = userPlan?.plan === 'pro' ? 2000 : 200
          if (body.concurrency && typeof body.concurrency === 'number') {
            const maxAllowed = userPlan?.plan === 'pro' ? 3000 : 500
            const minAllowed = 50
            concurrency = Math.max(minAllowed, Math.min(body.concurrency, maxAllowed))
          }

          // Estimate time
          const estimate = estimateVerificationTime(uniqueEmails.length, concurrency)
          
          console.log('[verify-bulk] About to call verifyEmailsParallel with', uniqueEmails.length, 'emails')
          
          // Send initial estimate
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'estimate',
            totalEmails: uniqueEmails.length,
            concurrency,
            estimatedSeconds: estimate.avgSeconds,
            message: `Processing ${uniqueEmails.length.toLocaleString()} emails with ${concurrency} concurrent workers (estimated ${Math.ceil(estimate.avgSeconds / 60)} minutes)`
          })}\n\n`))

          // Verify emails in parallel with progress callback
          console.log('[verify-bulk] Calling verifyEmailsParallel NOW')
          let results: any[]
          try {
            results = await verifyEmailsParallel(uniqueEmails, {
              concurrency,
              onProgress: async (progress) => {
                processedCount = progress.processed
                validCount = progress.valid
                invalidCount = progress.invalid

                const elapsedSeconds = (Date.now() - startTime) / 1000
                const speed = processedCount / elapsedSeconds
                const progressPercentage = Math.round((processedCount / uniqueEmails.length) * 100)

                // Update job progress
                if (jobId) {
                  await supabase
                    .from('verification_jobs')
                    .update({
                      processed_emails: processedCount,
                      valid_count: validCount,
                      invalid_count: invalidCount,
                      progress_percentage: progressPercentage,
                    })
                    .eq('id', jobId)
                }

              // Send batch progress webhook every 10%
              if (progressPercentage % 10 === 0 && progressPercentage > 0) {
                const { data: webhooks } = await supabase
                  .from('webhook_configs')
                  .select('*')
                  .eq('user_id', user.id)
                  .eq('is_active', true)

                if (webhooks && webhooks.length > 0 && jobId) {
                  sendBatchProgressWebhook(webhooks, jobId, processedCount, uniqueEmails.length).catch(console.error)
                }
              }

              const progressData = {
                type: 'progress',
                processed: processedCount,
                total: uniqueEmails.length,
                percentage: progressPercentage,
                speed: Math.round(speed * 10) / 10,
                currentEmail: progress.currentEmail,
                valid: validCount,
                invalid: invalidCount,
                jobId,
              }

              controller.enqueue(encoder.encode(`data: ${JSON.stringify(progressData)}\n\n`))
            }
          })
            console.log('[verify-bulk] verifyEmailsParallel completed, got', results.length, 'results')
            // Log SMTP values for debugging
            results.forEach((r: any) => {
              console.log('[verify-bulk] Result:', r.email, 'SMTP:', r.smtp, 'Catch-All:', r.catch_all)
            })
          } catch (verifyError) {
            console.error('[verify-bulk] verifyEmailsParallel ERROR:', verifyError)
            throw verifyError
          }

          // Add advanced email intelligence to each result
          const resultsWithIntelligence = await Promise.all(
            results.map(async (result) => {
              try {
                const intelligence = await analyzeEmailIntelligence(
                  result.email,
                  result.syntax,
                  result.dns,
                  result.smtp,
                  result.disposable,
                  result.catch_all,
                  result.smtp // smtpConnected
                )
                
                return {
                  ...result,
                  smtp_provider: result.smtp_provider || intelligence.smtpProvider,
                  smtp_provider_type: intelligence.smtpProviderType,
                  confidence_level: intelligence.confidenceLevel,
                  confidence_reasons: intelligence.confidenceReasons,
                  reputation_score: intelligence.reputationScore,
                  is_spam_trap: intelligence.isSpamTrap,
                  is_role_based: intelligence.isRoleBased,
                  role_type: intelligence.roleType,
                  email_age: intelligence.estimatedAge,
                  domain_health_score: intelligence.domainHealthScore,
                  inbox_placement_score: intelligence.inboxPlacementScore,
                  mx_priority: intelligence.mxPriority,
                  insights: intelligence.insights,
                  has_spf: intelligence.hasSPF,
                  has_dmarc: intelligence.hasDMARC,
                  spf_record: intelligence.spfRecord,
                  dmarc_policy: intelligence.dmarcPolicy
                }
              } catch (error) {
                // Return original result if intelligence analysis fails
                return result
              }
            })
          )

          const response: BulkVerificationResponse = {
            total: emails.length,
            unique: uniqueEmails.length,
            duplicates: duplicates.length,
            duplicateEmails: duplicates,
            valid: resultsWithIntelligence.filter(r => r.valid).length,
            invalid: resultsWithIntelligence.filter(r => !r.valid).length,
            results: resultsWithIntelligence
          }

          // Save to history
          try {
            await supabase.from('verification_history').insert({
              user_id: user.id,
              verification_type: 'bulk',
              email_count: uniqueEmails.length,
              valid_count: response.valid,
              invalid_count: response.invalid,
              results: resultsWithIntelligence
            })

            await supabase
              .from('user_plans')
              .update({ 
                verifications_used: (userPlan?.verifications_used || 0) + uniqueEmails.length,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)

            // Update job to completed
            if (jobId) {
              await supabase
                .from('verification_jobs')
                .update({
                  status: 'completed',
                  results: resultsWithIntelligence,
                  completed_at: new Date().toISOString(),
                })
                .eq('id', jobId)

              // Trigger webhooks
              const { data: webhooks } = await supabase
                .from('webhook_configs')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)

              if (webhooks && webhooks.length > 0) {
                // Send batch completed webhook
                sendBatchWebhook(webhooks, jobId, resultsWithIntelligence).catch(console.error)

                // Check quota and send warnings
                const quotaLimit = userPlan?.verifications_limit || 500
                const newVerificationCount = (userPlan?.verifications_used || 0) + uniqueEmails.length
                const percentageUsed = (newVerificationCount / quotaLimit) * 100

                if (percentageUsed >= 80 && percentageUsed < 100) {
                  sendQuotaWarningWebhook(webhooks, quotaLimit - newVerificationCount, quotaLimit).catch(console.error)
                }
                if (percentageUsed >= 100) {
                  sendQuotaExceededWebhook(webhooks, quotaLimit).catch(console.error)
                }
              }
            }
          } catch (historyError) {
            console.error('Error saving history:', historyError)
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, results: response, jobId })}\n\n`))
          controller.close()
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Original non-streaming behavior with parallel processing
    let concurrency = userPlan?.plan === 'pro' ? 2000 : 200
    if (body.concurrency && typeof body.concurrency === 'number') {
      const maxAllowed = userPlan?.plan === 'pro' ? 3000 : 500
      const minAllowed = 50
      concurrency = Math.max(minAllowed, Math.min(body.concurrency, maxAllowed))
    }
    const results = await verifyEmailsParallel(uniqueEmails, {
      concurrency,
      enableCache: true,
      enableCatchAll: true,
    })

    // Add advanced email intelligence to each result
    const resultsWithIntelligence = await Promise.all(
      results.map(async (result) => {
        try {
          const intelligence = await analyzeEmailIntelligence(
            result.email,
            result.syntax,
            result.dns,
            result.smtp,
            result.disposable,
            result.catch_all,
            result.smtp // smtpConnected
          )
          
          return {
            ...result,
            smtp_provider: result.smtp_provider || intelligence.smtpProvider,
            smtp_provider_type: intelligence.smtpProviderType,
            confidence_level: intelligence.confidenceLevel,
            confidence_reasons: intelligence.confidenceReasons,
            reputation_score: intelligence.reputationScore,
            is_spam_trap: intelligence.isSpamTrap,
            is_role_based: intelligence.isRoleBased,
            role_type: intelligence.roleType,
            email_age: intelligence.estimatedAge,
            domain_health_score: intelligence.domainHealthScore,
            inbox_placement_score: intelligence.inboxPlacementScore,
            mx_priority: intelligence.mxPriority,
            insights: intelligence.insights,
            has_spf: intelligence.hasSPF,
            has_dmarc: intelligence.hasDMARC,
            spf_record: intelligence.spfRecord,
            dmarc_policy: intelligence.dmarcPolicy
          }
        } catch (error) {
          return result
        }
      })
    )

    const response: BulkVerificationResponse = {
      total: emails.length,
      unique: uniqueEmails.length,
      duplicates: duplicates.length,
      duplicateEmails: duplicates,
      valid: resultsWithIntelligence.filter(r => r.valid).length,
      invalid: resultsWithIntelligence.filter(r => !r.valid).length,
      results: resultsWithIntelligence
    }

    // Save to history and increment usage count (only unique emails)
    try {
      await supabase.from('verification_history').insert({
        user_id: user.id,
        verification_type: 'bulk',
        email_count: uniqueEmails.length,
        valid_count: response.valid,
        invalid_count: response.invalid,
        results: resultsWithIntelligence
      })

      // Increment verification count (only unique emails)
      await supabase
        .from('user_plans')
        .update({ 
          verifications_used: (userPlan?.verifications_used || 0) + uniqueEmails.length,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    } catch (historyError) {
      console.error('Error saving history:', historyError)
      // Don't fail the request if history save fails
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Bulk verification error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
