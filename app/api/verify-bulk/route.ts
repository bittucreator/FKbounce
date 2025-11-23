import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns'
import { promisify } from 'util'
import net from 'net'
import emailValidator from 'email-validator'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, rateLimitConfigs } from '@/lib/ratelimit'
import { dnsCache } from '@/lib/dns-cache'
import { deliverWebhook, WebhookPayload } from '@/lib/webhook-delivery'
import { verifyEmailsParallel, estimateVerificationTime } from '@/lib/parallel-verifier'
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

async function checkSMTP(email: string, mxRecords: dns.MxRecord[], attempt: number = 0): Promise<boolean> {
  if (!mxRecords || mxRecords.length === 0) {
    return false
  }

  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxRecords[0].exchange)
    let accepted = false

    socket.setTimeout(10000) // Increased to 10 seconds

    socket.on('connect', () => {
      socket.write(`HELO verifier.com\r\n`)
    })

    socket.on('data', (data) => {
      const response = data.toString()
      
      if (response.includes('220') || response.includes('250')) {
        accepted = true
      }
      
      socket.end()
    })

    socket.on('timeout', async () => {
      socket.destroy()
      if (attempt < 2) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(r => setTimeout(r, delay))
        resolve(await checkSMTP(email, mxRecords, attempt + 1))
      } else {
        resolve(false)
      }
    })

    socket.on('error', async () => {
      if (attempt < 2) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(r => setTimeout(r, delay))
        resolve(await checkSMTP(email, mxRecords, attempt + 1))
      } else {
        resolve(false)
      }
    })

    socket.on('close', () => {
      resolve(accepted)
    })
  })
}

function isDisposable(domain: string): boolean {
  return disposableDomains.includes(domain.toLowerCase())
}

async function checkCatchAll(domain: string, mxRecords: dns.MxRecord[]): Promise<boolean> {
  if (!mxRecords || mxRecords.length === 0) {
    return false
  }

  const randomEmail = `random${Date.now()}${Math.random().toString(36).substring(7)}@${domain}`
  
  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxRecords[0].exchange)
    let responses: string[] = []

    socket.setTimeout(10000) // Increased to 10 seconds

    socket.on('connect', () => {
      socket.write(`HELO verifier.com\r\n`)
    })

    socket.on('data', (data) => {
      const response = data.toString()
      responses.push(response)
      
      if (response.includes('220') && !responses.some(r => r.includes('MAIL FROM'))) {
        socket.write(`MAIL FROM:<test@verifier.com>\r\n`)
      } else if (response.includes('250') && responses.filter(r => r.includes('250')).length === 1) {
        socket.write(`RCPT TO:<${randomEmail}>\r\n`)
      } else if (response.includes('250') && responses.filter(r => r.includes('250')).length >= 2) {
        socket.end()
        resolve(true)
      } else if (response.includes('550') || response.includes('551') || response.includes('553')) {
        socket.end()
        resolve(false)
      }
    })

    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })

    socket.on('error', () => {
      resolve(false)
    })

    socket.on('close', () => {
      resolve(false)
    })
  })
}

async function verifyEmail(email: string): Promise<VerificationResult> {
  const result: VerificationResult = {
    email,
    valid: false,
    syntax: false,
    dns: false,
    smtp: false,
    disposable: false,
    catch_all: false,
    message: ''
  }

  result.syntax = emailValidator.validate(email)
  if (!result.syntax) {
    result.message = 'Invalid email syntax'
    return result
  }

  const domain = email.split('@')[1]

  result.disposable = isDisposable(domain)
  if (result.disposable) {
    result.message = 'Disposable email address detected'
    return result
  }

  try {
    const mxRecords = await dnsCache.getMxRecords(domain)
    result.dns = !!(mxRecords && mxRecords.length > 0)
    
    if (!result.dns || !mxRecords) {
      result.message = 'No MX records found for domain'
      return result
    }

    result.smtp = await checkSMTP(email, mxRecords)
    result.catch_all = await checkCatchAll(domain, mxRecords)
    
    result.valid = result.syntax && result.dns
    
    if (result.catch_all) {
      result.message = 'Email domain accepts all addresses (catch-all)'
    } else {
      result.message = result.valid ? 'Email is valid' : 'Email verification failed'
    }
    
  } catch (error) {
    result.message = 'DNS lookup failed'
  }

  return result
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emails, stream } = body

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
          
          // Send initial estimate
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'estimate',
            totalEmails: uniqueEmails.length,
            concurrency,
            estimatedSeconds: estimate.avgSeconds,
            message: `Processing ${uniqueEmails.length.toLocaleString()} emails with ${concurrency} concurrent workers (estimated ${Math.ceil(estimate.avgSeconds / 60)} minutes)`
          })}\n\n`))

          // Verify emails in parallel with progress callback
          const results = await verifyEmailsParallel(uniqueEmails, {
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

          const response: BulkVerificationResponse = {
            total: emails.length,
            unique: uniqueEmails.length,
            duplicates: duplicates.length,
            duplicateEmails: duplicates,
            valid: results.filter(r => r.valid).length,
            invalid: results.filter(r => !r.valid).length,
            results
          }

          // Save to history
          try {
            await supabase.from('verification_history').insert({
              user_id: user.id,
              verification_type: 'bulk',
              email_count: uniqueEmails.length,
              valid_count: response.valid,
              invalid_count: response.invalid,
              results: results
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
                  results: results,
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
                const payload: WebhookPayload = {
                  event: 'bulk_verification_complete',
                  job_id: jobId,
                  timestamp: new Date().toISOString(),
                  data: {
                    total: response.total,
                    unique: response.unique,
                    valid: response.valid,
                    invalid: response.invalid,
                    duplicates: response.duplicates,
                  }
                }

                // Deliver webhooks asynchronously
                for (const webhook of webhooks) {
                  deliverWebhook(webhook, payload).then(async (result) => {
                    await supabase.from('webhook_deliveries').insert({
                      webhook_config_id: webhook.id,
                      verification_job_id: jobId,
                      event_type: payload.event,
                      payload: payload,
                      status: result.success ? 'success' : 'failed',
                      response_code: result.statusCode,
                      response_body: result.responseBody,
                      delivered_at: result.success ? new Date().toISOString() : null,
                    })
                  }).catch(console.error)
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

    const response: BulkVerificationResponse = {
      total: emails.length,
      unique: uniqueEmails.length,
      duplicates: duplicates.length,
      duplicateEmails: duplicates,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      results
    }

    // Save to history and increment usage count (only unique emails)
    try {
      await supabase.from('verification_history').insert({
        user_id: user.id,
        verification_type: 'bulk',
        email_count: uniqueEmails.length,
        valid_count: response.valid,
        invalid_count: response.invalid,
        results: results
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
