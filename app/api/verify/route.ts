import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns'
import { promisify } from 'util'
import emailValidator from 'email-validator'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, rateLimitConfigs } from '@/lib/ratelimit'
import { dnsCache } from '@/lib/dns-cache'
import { getDomainCache, setDomainCache } from '@/lib/domain-cache'
import { analyzeEmailIntelligence } from '@/lib/email-intelligence'
import { sendVerificationWebhook, sendQuotaWarningWebhook, sendQuotaExceededWebhook } from '@/lib/webhooks/delivery'
import { verifySMTP } from '@/lib/smtp-service'
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
}

function isDisposable(domain: string): boolean {
  return disposableDomains.includes(domain.toLowerCase())
}

async function verifyEmail(email: string, enableCatchAll: boolean = true, enableCache: boolean = true): Promise<{ result: VerificationResult; smtpConnected: boolean }> {
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
  let smtpConnected = false

  result.syntax = emailValidator.validate(email)
  if (!result.syntax) {
    result.message = 'Invalid email syntax'
    return { result, smtpConnected }
  }

  const domain = email.split('@')[1]

  result.disposable = isDisposable(domain)
  if (result.disposable) {
    result.message = 'Disposable email address detected'
    return { result, smtpConnected }
  }

  try {
    // Check domain cache first
    if (enableCache) {
      const cached = getDomainCache(domain)
      if (cached) {
        result.dns = cached.dns
        result.smtp = cached.smtp
        result.catch_all = cached.catch_all
        result.smtp_provider = cached.smtp_provider
        result.valid = result.syntax && result.dns
        
        if (result.catch_all && enableCatchAll) {
          result.message = 'Email domain accepts all addresses (catch-all)'
        } else {
          result.message = result.valid ? 'Email is valid' : 'Email verification failed'
        }
        return { result, smtpConnected: true }
      }
    }

    // Check DNS/MX records
    const mxRecords = await dnsCache.getMxRecords(domain)
    result.dns = !!(mxRecords && mxRecords.length > 0)
    
    if (!result.dns || !mxRecords) {
      result.message = 'No MX records found for domain'
      return { result, smtpConnected }
    }

    // Use Azure SMTP microservice for SMTP and catch-all checks
    const smtpServiceUrl = process.env.SMTP_SERVICE_URL
    const smtpServiceKey = process.env.SMTP_SERVICE_API_KEY

    if (smtpServiceUrl && smtpServiceKey) {
      // Use the Azure microservice
      const smtpResult = await verifySMTP(email)
      result.smtp = smtpResult.smtp
      result.catch_all = enableCatchAll ? smtpResult.catch_all : false
      result.smtp_provider = smtpResult.smtp_provider || undefined
      smtpConnected = smtpResult.connected
    } else {
      // Fallback: Skip SMTP check if microservice not configured
      result.smtp = false
      result.catch_all = false
      smtpConnected = false
      console.warn('SMTP microservice not configured, skipping SMTP verification')
    }
    
    // Cache the domain results
    if (enableCache) {
      setDomainCache(domain, result.dns, result.smtp, result.catch_all, mxRecords, result.smtp_provider)
    }
    
    result.valid = result.syntax && result.dns
    
    if (result.catch_all && enableCatchAll) {
      result.message = 'Email domain accepts all addresses (catch-all)'
    } else {
      result.message = result.valid ? 'Email is valid' : 'Email verification failed'
    }
    
  } catch (error) {
    console.error('Verification error:', error)
    result.message = 'DNS lookup failed'
  }

  return { result, smtpConnected }
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

    const { result, smtpConnected } = await verifyEmail(email, enableCatchAll, enableCache)
    
    // Add advanced email intelligence
    try {
      const intelligence = await analyzeEmailIntelligence(
        email,
        result.syntax,
        result.dns,
        result.smtp,
        result.disposable,
        result.catch_all,
        smtpConnected
      )
      
      result.smtp_provider = intelligence.smtpProvider
      result.smtp_provider_type = intelligence.smtpProviderType
      result.confidence_level = intelligence.confidenceLevel
      result.confidence_reasons = intelligence.confidenceReasons
      result.reputation_score = intelligence.reputationScore
      result.is_spam_trap = intelligence.isSpamTrap
      result.is_role_based = intelligence.isRoleBased
      result.role_type = intelligence.roleType
      result.email_age = intelligence.estimatedAge
      result.domain_health_score = intelligence.domainHealthScore
      result.inbox_placement_score = intelligence.inboxPlacementScore
      result.mx_priority = intelligence.mxPriority
      result.insights = intelligence.insights
    } catch (intelligenceError) {
      console.error('Error analyzing email intelligence:', intelligenceError)
      // Don't fail the request if intelligence analysis fails
    }
    
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
      const newCount = (userPlan?.verifications_used || 0) + 1
      await supabase
        .from('user_plans')
        .update({ 
          verifications_used: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      // Check quota and send webhook warnings
      const quotaLimit = userPlan?.verifications_limit || 500
      const percentageUsed = (newCount / quotaLimit) * 100

      // Fetch user's webhooks
      const { data: webhooks } = await supabase
        .from('webhook_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (webhooks && webhooks.length > 0) {
        // Send verification completed/failed webhook
        sendVerificationWebhook(webhooks, result).catch(console.error)

        // Send quota warning at 80% usage
        if (percentageUsed >= 80 && percentageUsed < 100) {
          sendQuotaWarningWebhook(webhooks, quotaLimit - newCount, quotaLimit).catch(console.error)
        }

        // Send quota exceeded webhook at 100%
        if (percentageUsed >= 100) {
          sendQuotaExceededWebhook(webhooks, quotaLimit).catch(console.error)
        }
      }
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
