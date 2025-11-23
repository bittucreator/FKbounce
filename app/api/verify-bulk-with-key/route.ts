import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns'
import { promisify } from 'util'
import net from 'net'
import emailValidator from 'email-validator'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, rateLimitConfigs } from '@/lib/ratelimit'
import { dnsCache } from '@/lib/dns-cache'
import { verifyEmailsParallel, estimateVerificationTime } from '@/lib/parallel-verifier'
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
  catch_all: boolean
  message: string
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
    const { emails } = body

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'emails array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (emails.length > 1000) {
      return NextResponse.json(
        { error: 'Maximum 1000 emails per request' },
        { status: 400 }
      )
    }

    // Check if user has enough quota for this bulk verification
    const remainingQuota = (userPlan?.verifications_limit || 0) - (userPlan?.verifications_used || 0)
    if (remainingQuota < emails.length) {
      return NextResponse.json(
        { 
          error: 'Insufficient verification quota',
          required: emails.length,
          remaining: remainingQuota
        },
        { status: 403 }
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

    // Verify unique emails only using parallel processing
    const concurrency = userPlan?.plan === 'pro' ? 500 : 100
    const results = await verifyEmailsParallel(uniqueEmails, {
      concurrency,
      enableCache: true,
      enableCatchAll: true,
    })

    const validCount = results.filter(r => r.valid).length
    const invalidCount = results.length - validCount
    
    // Save to history and increment usage count
    try {
      await supabaseAdmin.from('verification_history').insert({
        user_id: userId,
        verification_type: 'bulk',
        email_count: uniqueEmails.length,
        valid_count: validCount,
        invalid_count: invalidCount,
        results: results
      })

      // Increment verification count (only unique emails)
      await supabaseAdmin
        .from('user_plans')
        .update({ 
          verifications_used: (userPlan?.verifications_used || 0) + uniqueEmails.length,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
    } catch (error) {
      console.error('Error saving verification:', error)
    }

    return NextResponse.json({
      total: emails.length,
      unique: uniqueEmails.length,
      duplicates: duplicates.length,
      duplicateEmails: duplicates,
      valid: validCount,
      invalid: invalidCount,
      results
    }, {
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
