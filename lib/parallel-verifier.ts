import dns from 'dns'
import emailValidator from 'email-validator'
import { dnsCache } from './dns-cache'
import { verifySMTPBulk } from './smtp-service'
// @ts-ignore
import disposableDomains from 'disposable-email-domains'

interface VerificationResult {
  email: string
  valid: boolean
  syntax: boolean
  dns: boolean
  smtp: boolean
  disposable: boolean
  catch_all: boolean
  smtp_provider?: string
  message: string
}

interface ParallelVerifierOptions {
  concurrency?: number // Number of concurrent workers (default: 2000)
  enableCatchAll?: boolean
  enableCache?: boolean
  onProgress?: (progress: {
    processed: number
    total: number
    percentage: number
    speed: number
    currentEmail: string
    valid: number
    invalid: number
  }) => void
}

function isDisposable(domain: string): boolean {
  return disposableDomains.includes(domain.toLowerCase())
}

/**
 * Group emails by domain for optimized processing
 */
function groupEmailsByDomain(emails: string[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>()
  
  emails.forEach(email => {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return
    
    if (!grouped.has(domain)) {
      grouped.set(domain, [])
    }
    grouped.get(domain)!.push(email)
  })
  
  return grouped
}

/**
 * Parallel email verifier using Azure SMTP microservice
 */
export async function verifyEmailsParallel(
  emails: string[],
  options: ParallelVerifierOptions = {}
): Promise<VerificationResult[]> {
  const {
    concurrency = 100, // Batch size for microservice calls
    enableCatchAll = true,
    enableCache = true,
    onProgress
  } = options

  const results: VerificationResult[] = []
  const startTime = Date.now()
  let processedCount = 0

  // Pre-filter emails with syntax/disposable checks (fast, local)
  const preFilteredEmails: { email: string; result: VerificationResult | null }[] = []
  
  for (const email of emails) {
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

    // Syntax check
    result.syntax = emailValidator.validate(email)
    if (!result.syntax) {
      result.message = 'Invalid email syntax'
      preFilteredEmails.push({ email, result })
      continue
    }

    // Disposable check
    const domain = email.split('@')[1]
    result.disposable = isDisposable(domain)
    if (result.disposable) {
      result.message = 'Disposable email address detected'
      preFilteredEmails.push({ email, result })
      continue
    }

    // Needs SMTP verification
    preFilteredEmails.push({ email, result: null })
  }

  // Separate emails that need SMTP verification
  const emailsForSMTP = preFilteredEmails
    .filter(e => e.result === null)
    .map(e => e.email)

  // Check if SMTP service is configured
  const smtpServiceUrl = process.env.SMTP_SERVICE_URL
  const smtpServiceKey = process.env.SMTP_SERVICE_API_KEY

  console.log('[Parallel Verifier] SMTP Service URL:', smtpServiceUrl ? 'configured' : 'NOT SET')
  console.log('[Parallel Verifier] SMTP Service Key:', smtpServiceKey ? 'configured' : 'NOT SET')
  console.log('[Parallel Verifier] Emails for SMTP:', emailsForSMTP.length)

  if (smtpServiceUrl && smtpServiceKey && emailsForSMTP.length > 0) {
    // Use Azure SMTP microservice for bulk verification
    // Process in batches of 100 (microservice limit)
    for (let i = 0; i < emailsForSMTP.length; i += 100) {
      const batch = emailsForSMTP.slice(i, i + 100)
      
      try {
        const smtpResults = await verifySMTPBulk(batch)
        
        // Map SMTP results back to verification results
        for (const smtpResult of smtpResults.results) {
          const domain = smtpResult.email.split('@')[1]
          let mxRecords: dns.MxRecord[] = []
          
          try {
            mxRecords = await dnsCache.getMxRecords(domain) || []
          } catch (e) {
            // DNS failed
          }

          const result: VerificationResult = {
            email: smtpResult.email,
            valid: true,
            syntax: true,
            dns: mxRecords.length > 0,
            smtp: smtpResult.smtp,
            disposable: false,
            catch_all: enableCatchAll ? smtpResult.catch_all : false,
            smtp_provider: smtpResult.smtp_provider || undefined,
            message: smtpResult.catch_all 
              ? 'Email domain accepts all addresses (catch-all)'
              : (smtpResult.smtp ? 'Email is valid' : 'Email verification failed')
          }
          
          results.push(result)
        }
      } catch (error) {
        console.error('SMTP service bulk error:', error)
        // Fallback: mark as unverified
        for (const email of batch) {
          const domain = email.split('@')[1]
          let mxRecords: dns.MxRecord[] = []
          
          try {
            mxRecords = await dnsCache.getMxRecords(domain) || []
          } catch (e) {}

          results.push({
            email,
            valid: mxRecords.length > 0,
            syntax: true,
            dns: mxRecords.length > 0,
            smtp: false,
            disposable: false,
            catch_all: false,
            message: 'SMTP verification unavailable'
          })
        }
      }

      processedCount += batch.length

      // Report progress
      if (onProgress) {
        const elapsedSeconds = (Date.now() - startTime) / 1000
        const speed = processedCount / elapsedSeconds
        const validCount = results.filter(r => r.valid).length
        const invalidCount = results.filter(r => !r.valid).length

        onProgress({
          processed: processedCount,
          total: emails.length,
          percentage: Math.round((processedCount / emails.length) * 100),
          speed: Math.round(speed * 10) / 10,
          currentEmail: batch[batch.length - 1],
          valid: validCount,
          invalid: invalidCount
        })
      }
    }
  } else {
    // No SMTP service configured - DNS-only verification
    console.warn('SMTP microservice not configured, using DNS-only verification for bulk')
    
    for (const email of emailsForSMTP) {
      const domain = email.split('@')[1]
      let mxRecords: dns.MxRecord[] = []
      
      try {
        mxRecords = await dnsCache.getMxRecords(domain) || []
      } catch (e) {}

      results.push({
        email,
        valid: mxRecords.length > 0,
        syntax: true,
        dns: mxRecords.length > 0,
        smtp: false,
        disposable: false,
        catch_all: false,
        message: mxRecords.length > 0 ? 'DNS valid (SMTP not checked)' : 'No MX records found'
      })
      
      processedCount++
      
      if (onProgress && processedCount % 100 === 0) {
        const elapsedSeconds = (Date.now() - startTime) / 1000
        const speed = processedCount / elapsedSeconds
        const validCount = results.filter(r => r.valid).length
        const invalidCount = results.filter(r => !r.valid).length

        onProgress({
          processed: processedCount,
          total: emails.length,
          percentage: Math.round((processedCount / emails.length) * 100),
          speed: Math.round(speed * 10) / 10,
          currentEmail: email,
          valid: validCount,
          invalid: invalidCount
        })
      }
    }
  }

  // Add pre-filtered results (syntax/disposable failures)
  for (const item of preFilteredEmails) {
    if (item.result !== null) {
      results.push(item.result)
    }
  }

  // Sort results to match original email order
  const emailOrder = new Map(emails.map((e, i) => [e.toLowerCase(), i]))
  results.sort((a, b) => {
    const orderA = emailOrder.get(a.email.toLowerCase()) ?? 0
    const orderB = emailOrder.get(b.email.toLowerCase()) ?? 0
    return orderA - orderB
  })

  return results
}

/**
 * Estimate verification time for given number of emails
 */
export function estimateVerificationTime(
  emailCount: number,
  concurrency: number = 500
): {
  minSeconds: number
  maxSeconds: number
  avgSeconds: number
  formattedTime: string
} {
  // Average 2-5 seconds per email with parallelization
  const avgTimePerEmail = 3.5
  const minTimePerEmail = 2
  const maxTimePerEmail = 5

  const totalSeconds = (emailCount / concurrency) * avgTimePerEmail
  const minSeconds = (emailCount / concurrency) * minTimePerEmail
  const maxSeconds = (emailCount / concurrency) * maxTimePerEmail

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  let formattedTime = ''
  if (hours > 0) formattedTime += `${hours}h `
  if (minutes > 0) formattedTime += `${minutes}m `
  formattedTime += `${seconds}s`

  return {
    minSeconds: Math.floor(minSeconds),
    maxSeconds: Math.floor(maxSeconds),
    avgSeconds: Math.floor(totalSeconds),
    formattedTime: formattedTime.trim()
  }
}
