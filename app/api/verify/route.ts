import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns'
import { promisify } from 'util'
import net from 'net'
import emailValidator from 'email-validator'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, rateLimitConfigs } from '@/lib/ratelimit'
import { dnsCache } from '@/lib/dns-cache'
import { getDomainCache, setDomainCache } from '@/lib/domain-cache'
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

async function checkSMTP(email: string, mxRecords: dns.MxRecord[], attempt: number = 0): Promise<boolean> {
  if (!mxRecords || mxRecords.length === 0) {
    return false
  }

  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxRecords[0].exchange)
    let accepted = false

    socket.setTimeout(5000) // 5 seconds for faster single verification

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
      // Exponential backoff retry (max 2 attempts)
      if (attempt < 1) {
        const delay = Math.pow(2, attempt) * 1000 // 1s, 2s
        await new Promise(r => setTimeout(r, delay))
        resolve(await checkSMTP(email, mxRecords, attempt + 1))
      } else {
        resolve(false)
      }
    })

    socket.on('error', async () => {
      // Retry on error
      if (attempt < 1) {
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

  // Generate random email to test
  const randomEmail = `random${Date.now()}${Math.random().toString(36).substring(7)}@${domain}`
  
  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxRecords[0].exchange)
    let responses: string[] = []

    socket.setTimeout(3000) // 3 seconds for catch-all check (faster)

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
        // If random email is accepted, it's catch-all
        socket.end()
        resolve(true)
      } else if (response.includes('550') || response.includes('551') || response.includes('553')) {
        // Random email rejected = not catch-all
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

async function verifyEmail(email: string, enableCatchAll: boolean = true, enableCache: boolean = true): Promise<VerificationResult> {
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
    // Check domain cache first
    if (enableCache) {
      const cached = getDomainCache(domain)
      if (cached) {
        result.dns = cached.dns
        result.smtp = cached.smtp
        result.catch_all = cached.catch_all
        result.valid = result.syntax && result.dns
        
        if (result.catch_all && enableCatchAll) {
          result.message = 'Email domain accepts all addresses (catch-all)'
        } else {
          result.message = result.valid ? 'Email is valid' : 'Email verification failed'
        }
        return result
      }
    }

    const mxRecords = await dnsCache.getMxRecords(domain)
    result.dns = !!(mxRecords && mxRecords.length > 0)
    
    if (!result.dns || !mxRecords) {
      result.message = 'No MX records found for domain'
      return result
    }

    result.smtp = await checkSMTP(email, mxRecords)
    
    // Only check catch-all if enabled
    if (enableCatchAll) {
      result.catch_all = await checkCatchAll(domain, mxRecords)
    }
    
    // Cache the domain results
    if (enableCache) {
      setDomainCache(domain, result.dns, result.smtp, result.catch_all, mxRecords)
    }
    
    result.valid = result.syntax && result.dns
    
    if (result.catch_all && enableCatchAll) {
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
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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
      `verify:${user.id}`,
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

    // Check if user has remaining verifications
    if (userPlan && userPlan.verifications_used >= userPlan.verifications_limit) {
      return NextResponse.json(
        { error: 'Verification limit reached. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // Get user settings for verification options
    let { data: settings } = await supabase
      .from('user_settings')
      .select('enable_catch_all_check, enable_domain_cache')
      .eq('user_id', user.id)
      .single()

    // Use defaults: enable catch-all but with fast timeout (already 5s)
    const enableCatchAll = settings?.enable_catch_all_check ?? true
    const enableCache = settings?.enable_domain_cache ?? true

    const result = await verifyEmail(email, enableCatchAll, enableCache)
    
    // Save to history and increment usage count
    try {
      await supabase.from('verification_history').insert({
        user_id: user.id,
        verification_type: 'single',
        email_count: 1,
        valid_count: result.valid ? 1 : 0,
        invalid_count: result.valid ? 0 : 1,
        results: [result]
      })

      // Increment verification count
      await supabase
        .from('user_plans')
        .update({ 
          verifications_used: (userPlan?.verifications_used || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    } catch (historyError) {
      console.error('Error saving history:', historyError)
      // Don't fail the request if history save fails
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
