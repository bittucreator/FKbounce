import dns from 'dns'
import { promisify } from 'util'

const resolveMx = promisify(dns.resolveMx)

interface EmailIntelligence {
  reputationScore: number
  isSpamTrap: boolean
  isRoleBased: boolean
  roleType?: string
  estimatedAge: string
  domainHealthScore: number
  inboxPlacementScore: number
  mxPriority: number[]
  insights: string[]
}

// Known spam trap patterns and domains
const SPAM_TRAP_INDICATORS = [
  'spamtrap',
  'honeypot',
  'blackhole',
  'abuse',
  'postmaster',
  'noreply',
  'no-reply'
]

const SPAM_TRAP_DOMAINS = [
  'spamtrap.com',
  'honeypot.net',
  'example.com',
  'test.com',
  'invalid.com'
]

// Role-based email patterns
const ROLE_BASED_PATTERNS = {
  'sales': ['sales', 'business', 'revenue', 'commercial'],
  'support': ['support', 'help', 'service', 'helpdesk', 'contact'],
  'info': ['info', 'information', 'general', 'inquiry'],
  'admin': ['admin', 'administrator', 'webmaster', 'root'],
  'marketing': ['marketing', 'promo', 'newsletter', 'campaigns'],
  'hr': ['hr', 'careers', 'jobs', 'recruiting', 'hiring'],
  'legal': ['legal', 'compliance', 'privacy', 'gdpr'],
  'billing': ['billing', 'invoice', 'payment', 'finance', 'accounts']
}

// Disposable/temporary email domains have lower reputation
const DISPOSABLE_DOMAINS = [
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.com',
  'throwaway.email'
]

/**
 * Calculate email reputation score (0-100)
 * Higher score = better reputation
 */
export function calculateReputationScore(
  email: string,
  domain: string,
  syntax: boolean,
  dns: boolean,
  smtp: boolean,
  disposable: boolean,
  catchAll: boolean,
  mxRecords: any[]
): number {
  let score = 50 // Start at neutral

  // Syntax validation (10 points)
  if (syntax) score += 10
  else score -= 20

  // DNS/MX records (20 points)
  if (dns) {
    score += 15
    if (mxRecords.length > 1) score += 5 // Multiple MX = better infrastructure
  } else {
    score -= 30
  }

  // SMTP validation (25 points)
  if (smtp) score += 25
  else score -= 15

  // Disposable email (-40 points - major red flag)
  if (disposable) score -= 40

  // Catch-all (-15 points - uncertain validity)
  if (catchAll) score -= 15

  // Check if it's a known spam trap
  const localPart = email.split('@')[0].toLowerCase()
  if (SPAM_TRAP_INDICATORS.some(trap => localPart.includes(trap))) {
    score -= 50
  }
  if (SPAM_TRAP_DOMAINS.includes(domain.toLowerCase())) {
    score -= 50
  }

  // Check for free email providers (slight negative for B2B)
  const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com']
  if (freeProviders.includes(domain.toLowerCase())) {
    score -= 5
  }

  // Role-based emails have slightly lower score for cold outreach
  if (isRoleBasedEmail(email).isRoleBased) {
    score -= 10
  }

  // Check for suspicious patterns
  if (/[0-9]{5,}/.test(localPart)) score -= 5 // Too many numbers
  if (/^[a-z]$/.test(localPart)) score -= 10 // Single letter
  if (localPart.length > 30) score -= 5 // Unusually long

  // Premium business domains boost score
  const businessTLDs = ['.com', '.net', '.org', '.co', '.io']
  if (businessTLDs.some(tld => domain.endsWith(tld))) {
    score += 5
  }

  // Clamp score between 0-100
  return Math.max(0, Math.min(100, score))
}

/**
 * Detect if email is likely a spam trap
 */
export function detectSpamTrap(email: string, domain: string): boolean {
  const localPart = email.split('@')[0].toLowerCase()
  
  // Check local part for spam trap indicators
  if (SPAM_TRAP_INDICATORS.some(trap => localPart.includes(trap))) {
    return true
  }
  
  // Check domain
  if (SPAM_TRAP_DOMAINS.includes(domain.toLowerCase())) {
    return true
  }
  
  // Suspicious patterns that might indicate spam traps
  if (/^(test|spam|trap|invalid|fake|dummy)[0-9]*@/.test(email.toLowerCase())) {
    return true
  }
  
  return false
}

/**
 * Detect role-based email addresses
 */
export function isRoleBasedEmail(email: string): { isRoleBased: boolean; roleType?: string } {
  const localPart = email.split('@')[0].toLowerCase()
  
  for (const [role, patterns] of Object.entries(ROLE_BASED_PATTERNS)) {
    if (patterns.some(pattern => localPart.includes(pattern))) {
      return { isRoleBased: true, roleType: role }
    }
  }
  
  return { isRoleBased: false }
}

/**
 * Estimate email age based on patterns and domain analysis
 */
export function estimateEmailAge(email: string, domain: string): string {
  const localPart = email.split('@')[0].toLowerCase()
  
  // Very old pattern indicators
  if (/^[a-z]+[0-9]{2}@/.test(email)) {
    return '10+ years' // firstname99@ pattern was popular in late 90s/early 2000s
  }
  
  // Corporate patterns suggest recent
  if (/^[a-z]+\.[a-z]+@/.test(email)) {
    return '2-5 years' // firstname.lastname@ is modern corporate standard
  }
  
  // Random string patterns
  if (/^[a-z0-9]{20,}@/.test(email)) {
    return '1-2 years' // Random generated emails are typically newer
  }
  
  // Gmail + period usage
  if (domain === 'gmail.com' && localPart.includes('.')) {
    return '5-10 years' // Gmail period trick was popular mid-2010s
  }
  
  // Disposable indicators
  if (DISPOSABLE_DOMAINS.some(d => domain.includes(d))) {
    return '< 1 week' // Disposable emails are very recent
  }
  
  // Default estimate
  return '3-7 years'
}

/**
 * Calculate domain health score based on MX records
 */
export async function analyzeDomainHealth(domain: string): Promise<{
  healthScore: number
  mxPriority: number[]
  insights: string[]
}> {
  const insights: string[] = []
  let healthScore = 50
  
  try {
    const mxRecords = await resolveMx(domain)
    const mxPriority = mxRecords.map(mx => mx.priority).sort((a, b) => a - b)
    
    if (mxRecords.length === 0) {
      healthScore = 0
      insights.push('No MX records found - domain cannot receive email')
      return { healthScore, mxPriority: [], insights }
    }
    
    // Multiple MX records = better redundancy
    if (mxRecords.length >= 3) {
      healthScore += 20
      insights.push(`Excellent redundancy with ${mxRecords.length} MX records`)
    } else if (mxRecords.length === 2) {
      healthScore += 10
      insights.push('Good redundancy with 2 MX records')
    } else {
      healthScore -= 10
      insights.push('Single MX record - no redundancy')
    }
    
    // Check for proper priority configuration
    const hasBackupMx = mxRecords.some(mx => mx.priority > 10)
    if (hasBackupMx && mxRecords.length > 1) {
      healthScore += 15
      insights.push('Properly configured MX priorities with backup servers')
    }
    
    // Check for enterprise mail providers
    const enterpriseProviders = ['google', 'outlook', 'microsoft', 'proofpoint', 'mimecast']
    const usesEnterprise = mxRecords.some(mx => 
      enterpriseProviders.some(provider => mx.exchange.toLowerCase().includes(provider))
    )
    if (usesEnterprise) {
      healthScore += 15
      insights.push('Uses enterprise-grade email infrastructure')
    }
    
    return { healthScore, mxPriority, insights }
  } catch (error) {
    return {
      healthScore: 0,
      mxPriority: [],
      insights: ['Unable to resolve MX records - domain may be invalid']
    }
  }
}

/**
 * Predict inbox placement probability (0-100)
 * Based on email quality indicators
 */
export function predictInboxPlacement(
  reputationScore: number,
  isSpamTrap: boolean,
  isRoleBased: boolean,
  disposable: boolean,
  domainHealthScore: number,
  smtp: boolean
): number {
  let score = 50 // Start neutral
  
  // Reputation heavily influences placement
  score += (reputationScore - 50) * 0.4
  
  // Spam trap = instant spam folder
  if (isSpamTrap) return 0
  
  // Disposable = very likely spam folder
  if (disposable) score -= 40
  
  // Role-based slightly reduces placement
  if (isRoleBased) score -= 15
  
  // SMTP verification improves confidence
  if (smtp) score += 20
  
  // Domain health affects placement
  score += (domainHealthScore - 50) * 0.3
  
  // Clamp between 0-100
  return Math.max(0, Math.min(100, score))
}

/**
 * Main function to analyze email intelligence
 */
export async function analyzeEmailIntelligence(
  email: string,
  syntax: boolean,
  dns: boolean,
  smtp: boolean,
  disposable: boolean,
  catchAll: boolean
): Promise<EmailIntelligence> {
  const domain = email.split('@')[1]
  const insights: string[] = []
  
  // Analyze domain health
  const { healthScore: domainHealthScore, mxPriority, insights: domainInsights } = await analyzeDomainHealth(domain)
  insights.push(...domainInsights)
  
  // Get MX records for reputation calculation
  let mxRecords: any[] = []
  try {
    mxRecords = await resolveMx(domain)
  } catch (error) {
    // MX resolution failed, already handled in analyzeDomainHealth
  }
  
  // Calculate reputation score
  const reputationScore = calculateReputationScore(
    email,
    domain,
    syntax,
    dns,
    smtp,
    disposable,
    catchAll,
    mxRecords
  )
  
  // Detect spam trap
  const isSpamTrap = detectSpamTrap(email, domain)
  if (isSpamTrap) {
    insights.push('⚠️ WARNING: This appears to be a spam trap email')
  }
  
  // Detect role-based
  const { isRoleBased, roleType } = isRoleBasedEmail(email)
  if (isRoleBased) {
    insights.push(`Role-based email detected: ${roleType}`)
  }
  
  // Estimate age
  const estimatedAge = estimateEmailAge(email, domain)
  insights.push(`Estimated email age: ${estimatedAge}`)
  
  // Predict inbox placement
  const inboxPlacementScore = predictInboxPlacement(
    reputationScore,
    isSpamTrap,
    isRoleBased,
    disposable,
    domainHealthScore,
    smtp
  )
  
  // Add reputation insights
  if (reputationScore >= 80) {
    insights.push('✅ Excellent reputation - highly recommended for outreach')
  } else if (reputationScore >= 60) {
    insights.push('✓ Good reputation - safe for outreach')
  } else if (reputationScore >= 40) {
    insights.push('⚠ Moderate reputation - use with caution')
  } else {
    insights.push('❌ Poor reputation - not recommended for outreach')
  }
  
  return {
    reputationScore,
    isSpamTrap,
    isRoleBased,
    roleType,
    estimatedAge,
    domainHealthScore,
    inboxPlacementScore,
    mxPriority,
    insights
  }
}
