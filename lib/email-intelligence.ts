import dns from 'dns'
import { promisify } from 'util'

const resolveMx = promisify(dns.resolveMx)
const resolveTxt = promisify(dns.resolveTxt)

interface EmailIntelligence {
  reputationScore: number
  isSpamTrap: boolean
  isRoleBased: boolean
  roleType?: string
  estimatedAge: string
  domainHealthScore: number
  inboxPlacementScore: number
  mxPriority: number[]
  smtpProvider?: string
  smtpProviderType?: 'enterprise' | 'business' | 'personal' | 'unknown'
  confidenceLevel: number
  confidenceReasons: string[]
  insights: string[]
  hasSPF: boolean
  hasDMARC: boolean
  spfRecord?: string
  dmarcPolicy?: string
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

// SMTP Provider detection patterns
const SMTP_PROVIDERS: Record<string, { name: string; type: 'enterprise' | 'business' | 'personal' | 'unknown'; patterns: string[] }> = {
  'Google Workspace': {
    name: 'Google Workspace',
    type: 'enterprise',
    patterns: ['google.com', 'googlemail.com', 'aspmx.l.google.com', 'alt1.aspmx.l.google.com', 'alt2.aspmx.l.google.com', 'gmail-smtp-in.l.google.com']
  },
  'Microsoft 365': {
    name: 'Microsoft 365',
    type: 'enterprise',
    patterns: ['outlook.com', 'protection.outlook.com', 'mail.protection.outlook.com', 'olc.protection.outlook.com']
  },
  'Gmail': {
    name: 'Gmail',
    type: 'personal',
    patterns: ['gmail.com']
  },
  'Yahoo': {
    name: 'Yahoo Mail',
    type: 'personal',
    patterns: ['yahoo.com', 'yahoodns.net', 'yahoomail.com', 'mta5.am0.yahoodns.net', 'mta6.am0.yahoodns.net', 'mta7.am0.yahoodns.net']
  },
  'Outlook/Hotmail': {
    name: 'Outlook/Hotmail',
    type: 'personal',
    patterns: ['hotmail.com', 'live.com', 'msn.com']
  },
  'Zoho': {
    name: 'Zoho Mail',
    type: 'business',
    patterns: ['zoho.com', 'zohomail.com', 'mx.zoho.com', 'mx2.zoho.com', 'mx3.zoho.com']
  },
  'Proofpoint': {
    name: 'Proofpoint',
    type: 'enterprise',
    patterns: ['pphosted.com', 'proofpoint.com', 'ppe-hosted.com']
  },
  'Mimecast': {
    name: 'Mimecast',
    type: 'enterprise',
    patterns: ['mimecast.com', 'mimecast.co.za', 'mailcontrol.com']
  },
  'Barracuda': {
    name: 'Barracuda',
    type: 'enterprise',
    patterns: ['barracudanetworks.com', 'barracuda.com', 'cuda-inc.com']
  },
  'Amazon SES': {
    name: 'Amazon SES',
    type: 'business',
    patterns: ['amazonses.com', 'amazonaws.com', 'inbound-smtp.us-east-1.amazonaws.com']
  },
  'SendGrid': {
    name: 'SendGrid',
    type: 'business',
    patterns: ['sendgrid.net', 'sendgrid.com']
  },
  'Mailgun': {
    name: 'Mailgun',
    type: 'business',
    patterns: ['mailgun.org', 'mailgun.com']
  },
  'iCloud': {
    name: 'iCloud Mail',
    type: 'personal',
    patterns: ['icloud.com', 'me.com', 'mac.com', 'apple.com']
  },
  'AOL': {
    name: 'AOL Mail',
    type: 'personal',
    patterns: ['aol.com', 'aim.com', 'netscape.net']
  },
  'ProtonMail': {
    name: 'ProtonMail',
    type: 'personal',
    patterns: ['protonmail.ch', 'protonmail.com', 'pm.me', 'mail.protonmail.ch']
  },
  'FastMail': {
    name: 'FastMail',
    type: 'business',
    patterns: ['fastmail.com', 'messagingengine.com', 'fastmail.fm']
  },
  'Rackspace': {
    name: 'Rackspace Email',
    type: 'business',
    patterns: ['emailsrvr.com', 'rackspace.com']
  },
  'GoDaddy': {
    name: 'GoDaddy Workspace',
    type: 'business',
    patterns: ['secureserver.net', 'godaddy.com', 'mailstore1.secureserver.net']
  },
  'OVH': {
    name: 'OVH Mail',
    type: 'business',
    patterns: ['ovh.net', 'ovh.com', 'mx0.ovh.net', 'mx1.ovh.net']
  },
  'Yandex': {
    name: 'Yandex Mail',
    type: 'personal',
    patterns: ['yandex.ru', 'yandex.com', 'mx.yandex.net', 'mx.yandex.ru']
  }
}

/**
 * Detect SMTP provider from MX records
 */
export function detectSMTPProvider(mxRecords: dns.MxRecord[]): { name: string; type: 'enterprise' | 'business' | 'personal' | 'unknown' } | null {
  if (!mxRecords || mxRecords.length === 0) {
    return null
  }
  
  for (const mx of mxRecords) {
    const exchange = mx.exchange.toLowerCase()
    
    for (const [providerName, provider] of Object.entries(SMTP_PROVIDERS)) {
      if (provider.patterns.some(pattern => exchange.includes(pattern))) {
        return { name: provider.name, type: provider.type }
      }
    }
  }
  
  // Check for common patterns that indicate self-hosted
  const primaryMx = mxRecords[0].exchange.toLowerCase()
  if (primaryMx.startsWith('mail.') || primaryMx.startsWith('mx.') || primaryMx.startsWith('smtp.')) {
    return { name: 'Self-Hosted', type: 'unknown' }
  }
  
  return null
}

/**
 * Calculate verification confidence level (0-100)
 * Higher = more confident in the result
 */
export function calculateConfidenceLevel(
  syntax: boolean,
  dns: boolean,
  smtp: boolean,
  smtpConnected: boolean,
  catchAll: boolean,
  mxRecords: dns.MxRecord[],
  smtpProvider: { name: string; type: string } | null
): { confidence: number; reasons: string[] } {
  let confidence = 0
  const reasons: string[] = []
  
  // Syntax check is very reliable (+20)
  if (syntax) {
    confidence += 20
    reasons.push('Valid email syntax')
  } else {
    reasons.push('Invalid email syntax detected')
    return { confidence: 0, reasons }
  }
  
  // DNS/MX lookup is reliable (+25)
  if (dns && mxRecords && mxRecords.length > 0) {
    confidence += 25
    reasons.push(`MX records found (${mxRecords.length} server${mxRecords.length > 1 ? 's' : ''})`)
  } else {
    reasons.push('No MX records found')
    return { confidence, reasons }
  }
  
  // SMTP connection established (+15)
  if (smtpConnected) {
    confidence += 15
    reasons.push('SMTP connection successful')
  } else {
    reasons.push('Could not establish SMTP connection')
  }
  
  // SMTP validation (+25 if validated, -10 if rejected)
  if (smtp) {
    confidence += 25
    reasons.push('SMTP verification passed')
  } else if (smtpConnected) {
    // Connected but email rejected
    confidence += 10 // Still somewhat confident it's invalid
    reasons.push('SMTP server rejected the address')
  }
  
  // Known provider increases confidence (+10)
  if (smtpProvider) {
    if (smtpProvider.type === 'enterprise') {
      confidence += 10
      reasons.push(`Enterprise provider: ${smtpProvider.name}`)
    } else if (smtpProvider.type === 'business') {
      confidence += 8
      reasons.push(`Business provider: ${smtpProvider.name}`)
    } else if (smtpProvider.type === 'personal') {
      confidence += 5
      reasons.push(`Personal provider: ${smtpProvider.name}`)
    }
  }
  
  // Catch-all domains reduce confidence (-15)
  if (catchAll) {
    confidence -= 15
    reasons.push('Catch-all domain (accepts any address)')
  } else if (smtpConnected) {
    confidence += 5
    reasons.push('Not a catch-all domain')
  }
  
  return {
    confidence: Math.max(0, Math.min(100, confidence)),
    reasons
  }
}

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
  hasSPF: boolean
  hasDMARC: boolean
  spfRecord?: string
  dmarcPolicy?: string
}> {
  const insights: string[] = []
  let healthScore = 50
  let hasSPF = false
  let hasDMARC = false
  let spfRecord: string | undefined
  let dmarcPolicy: string | undefined
  
  try {
    const mxRecords = await resolveMx(domain)
    const mxPriority = mxRecords.map(mx => mx.priority).sort((a, b) => a - b)
    
    if (mxRecords.length === 0) {
      healthScore = 0
      insights.push('No MX records found - domain cannot receive email')
      return { healthScore, mxPriority: [], insights, hasSPF: false, hasDMARC: false }
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
    
    // Check SPF record
    try {
      const txtRecords = await resolveTxt(domain)
      const spfRecords = txtRecords.flat().filter(txt => txt.startsWith('v=spf1'))
      if (spfRecords.length > 0) {
        hasSPF = true
        spfRecord = spfRecords[0]
        healthScore += 10
        insights.push('✓ SPF record configured')
        
        // Check SPF strictness
        if (spfRecord.includes('-all')) {
          healthScore += 5
          insights.push('  └ Strict SPF policy (-all)')
        } else if (spfRecord.includes('~all')) {
          insights.push('  └ Soft-fail SPF policy (~all)')
        }
      } else {
        healthScore -= 10
        insights.push('✗ No SPF record found')
      }
    } catch (error) {
      insights.push('✗ Could not check SPF record')
    }
    
    // Check DMARC record
    try {
      const dmarcRecords = await resolveTxt(`_dmarc.${domain}`)
      const dmarc = dmarcRecords.flat().find(txt => txt.startsWith('v=DMARC1'))
      if (dmarc) {
        hasDMARC = true
        healthScore += 10
        insights.push('✓ DMARC record configured')
        
        // Parse DMARC policy
        const policyMatch = dmarc.match(/p=(none|quarantine|reject)/i)
        if (policyMatch) {
          dmarcPolicy = policyMatch[1].toLowerCase()
          if (dmarcPolicy === 'reject') {
            healthScore += 10
            insights.push('  └ Strict DMARC policy (p=reject)')
          } else if (dmarcPolicy === 'quarantine') {
            healthScore += 5
            insights.push('  └ Moderate DMARC policy (p=quarantine)')
          } else {
            insights.push('  └ Monitoring-only DMARC (p=none)')
          }
        }
      } else {
        healthScore -= 5
        insights.push('✗ No DMARC record found')
      }
    } catch (error) {
      insights.push('✗ Could not check DMARC record')
    }
    
    return { healthScore, mxPriority, insights, hasSPF, hasDMARC, spfRecord, dmarcPolicy }
  } catch (error) {
    return {
      healthScore: 0,
      mxPriority: [],
      insights: ['Unable to resolve MX records - domain may be invalid'],
      hasSPF: false,
      hasDMARC: false
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
  catchAll: boolean,
  smtpConnected: boolean = smtp // Assume connected if smtp passed
): Promise<EmailIntelligence> {
  const domain = email.split('@')[1]
  const insights: string[] = []
  
  // Analyze domain health
  const { healthScore: domainHealthScore, mxPriority, insights: domainInsights, hasSPF, hasDMARC, spfRecord, dmarcPolicy } = await analyzeDomainHealth(domain)
  insights.push(...domainInsights)
  
  // Get MX records for reputation calculation
  let mxRecords: dns.MxRecord[] = []
  try {
    mxRecords = await resolveMx(domain)
  } catch (error) {
    // MX resolution failed, already handled in analyzeDomainHealth
  }
  
  // Detect SMTP provider
  const smtpProviderInfo = detectSMTPProvider(mxRecords)
  if (smtpProviderInfo) {
    insights.push(`📧 Email provider: ${smtpProviderInfo.name}`)
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
  
  // Calculate confidence level
  const { confidence: confidenceLevel, reasons: confidenceReasons } = calculateConfidenceLevel(
    syntax,
    dns,
    smtp,
    smtpConnected,
    catchAll,
    mxRecords,
    smtpProviderInfo
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
  
  // Add confidence insight
  if (confidenceLevel >= 80) {
    insights.push(`🎯 High confidence: ${confidenceLevel}%`)
  } else if (confidenceLevel >= 60) {
    insights.push(`📊 Moderate confidence: ${confidenceLevel}%`)
  } else {
    insights.push(`⚠️ Low confidence: ${confidenceLevel}%`)
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
    smtpProvider: smtpProviderInfo?.name,
    smtpProviderType: smtpProviderInfo?.type,
    confidenceLevel,
    confidenceReasons,
    insights,
    hasSPF,
    hasDMARC,
    spfRecord,
    dmarcPolicy
  }
}
