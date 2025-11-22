import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns'
import { promisify } from 'util'
import net from 'net'
import emailValidator from 'email-validator'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, rateLimitConfigs } from '@/lib/ratelimit'
// @ts-ignore
import disposableDomains from 'disposable-email-domains'

const resolveMx = promisify(dns.resolveMx)

// Create admin client for API key verification
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface VerificationResult {
  email: string
  valid: boolean
  syntax: boolean
  dns: boolean
  smtp: boolean
  disposable: boolean
  message: string
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
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7) // Remove 'Bearer '

    // Verify API key and get user
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id')
      .eq('key', apiKey)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const userId = keyData.user_id

    // Update last_used_at
    await supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key', apiKey)

    // Get user plan for rate limiting
    const { data: userPlan } = await supabaseAdmin
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Apply rate limiting based on user plan
    const rateConfig = userPlan?.plan === 'pro' 
      ? rateLimitConfigs.apiPro 
      : rateLimitConfigs.apiFree

    const rateLimitResult = await rateLimit(
      `api-verify:${userId}`,
      rateConfig
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
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

    // Check monthly verification limits
    if (userPlan && userPlan.verifications_used >= userPlan.verifications_limit) {
      return NextResponse.json(
        { error: 'Monthly verification limit reached. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const result = await verifyEmail(email)
    
    // Save to history and increment usage count
    try {
      await supabaseAdmin.from('verification_history').insert({
        user_id: userId,
        verification_type: 'single',
        email_count: 1,
        valid_count: result.valid ? 1 : 0,
        invalid_count: result.valid ? 0 : 1,
        results: [result]
      })

      // Increment verification count
      await supabaseAdmin
        .from('user_plans')
        .update({ 
          verifications_used: (userPlan?.verifications_used || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
    } catch (error) {
      console.error('Error saving verification:', error)
    }

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toString(),
      }
    })
  } catch (error) {
    console.error('API verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
