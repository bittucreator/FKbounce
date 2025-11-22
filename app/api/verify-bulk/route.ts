import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns'
import { promisify } from 'util'
import net from 'net'
import emailValidator from 'email-validator'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, rateLimitConfigs } from '@/lib/ratelimit'
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
  message: string
}

interface BulkVerificationResponse {
  total: number
  valid: number
  invalid: number
  results: VerificationResult[]
}

async function checkSMTP(email: string, mxRecords: dns.MxRecord[]): Promise<boolean> {
  if (!mxRecords || mxRecords.length === 0) {
    return false
  }

  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxRecords[0].exchange)
    let accepted = false

    socket.setTimeout(5000)

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

    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })

    socket.on('error', () => {
      resolve(false)
    })

    socket.on('close', () => {
      resolve(accepted)
    })
  })
}

function isDisposable(domain: string): boolean {
  return disposableDomains.includes(domain.toLowerCase())
}

async function verifyEmail(email: string): Promise<VerificationResult> {
  const result: VerificationResult = {
    email,
    valid: false,
    syntax: false,
    dns: false,
    smtp: false,
    disposable: false,
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
    const mxRecords = await resolveMx(domain)
    result.dns = mxRecords && mxRecords.length > 0
    
    if (!result.dns) {
      result.message = 'No MX records found for domain'
      return result
    }

    result.smtp = await checkSMTP(email, mxRecords)
    
    result.valid = result.syntax && result.dns
    result.message = result.valid ? 'Email is valid' : 'Email verification failed'
    
  } catch (error) {
    result.message = 'DNS lookup failed'
  }

  return result
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emails } = body

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

    const results = await Promise.all(
      emails.map(email => verifyEmail(email))
    )

    const response: BulkVerificationResponse = {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      results
    }

    // Save to history and increment usage count
    try {
      await supabase.from('verification_history').insert({
        user_id: user.id,
        verification_type: 'bulk',
        email_count: response.total,
        valid_count: response.valid,
        invalid_count: response.invalid,
        results: results
      })

      // Increment verification count
      await supabase
        .from('user_plans')
        .update({ 
          verifications_used: (userPlan?.verifications_used || 0) + response.total,
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
