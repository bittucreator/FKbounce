import dns from 'dns'
import net from 'net'
import emailValidator from 'email-validator'
import { dnsCache } from './dns-cache'
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

async function checkSMTP(email: string, mxRecords: dns.MxRecord[], attempt: number = 0): Promise<boolean> {
  if (!mxRecords || mxRecords.length === 0) {
    return false
  }

  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxRecords[0].exchange)
    let responses: string[] = []
    let accepted = false

    socket.setTimeout(10000)

    socket.on('connect', () => {
      socket.write(`HELO verifier.com\r\n`)
    })

    socket.on('data', (data) => {
      const response = data.toString()
      responses.push(response)
      
      // Initial connection greeting (220)
      if (response.includes('220') && !responses.some(r => r.includes('MAIL FROM'))) {
        socket.write(`MAIL FROM:<test@verifier.com>\r\n`)
      } 
      // MAIL FROM accepted (250), now send RCPT TO
      else if (response.includes('250') && responses.filter(r => r.includes('250')).length === 1) {
        socket.write(`RCPT TO:<${email}>\r\n`)
      } 
      // RCPT TO accepted (250) - email exists!
      else if (response.includes('250') && responses.filter(r => r.includes('250')).length >= 2) {
        accepted = true
        socket.write(`QUIT\r\n`)
        socket.end()
      } 
      // RCPT TO rejected (550, 551, 553) - email doesn't exist
      else if (response.includes('550') || response.includes('551') || response.includes('553')) {
        accepted = false
        socket.write(`QUIT\r\n`)
        socket.end()
      }
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
    let catchAllDetected = false

    socket.setTimeout(10000)

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
        catchAllDetected = true
        socket.write(`QUIT\r\n`)
        socket.end()
      } else if (response.includes('550') || response.includes('551') || response.includes('553')) {
        catchAllDetected = false
        socket.write(`QUIT\r\n`)
        socket.end()
      }
    })

    socket.on('timeout', () => {
      socket.destroy()
      resolve(catchAllDetected)
    })

    socket.on('error', () => {
      resolve(catchAllDetected)
    })

    socket.on('close', () => {
      resolve(catchAllDetected)
    })
  })
}

async function verifyEmail(
  email: string,
  enableCatchAll: boolean = true,
  enableCache: boolean = true
): Promise<VerificationResult> {
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
    
    if (enableCatchAll) {
      result.catch_all = await checkCatchAll(domain, mxRecords)
    }
    
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
 * Parallel email verifier with worker pool
 */
export async function verifyEmailsParallel(
  emails: string[],
  options: ParallelVerifierOptions = {}
): Promise<VerificationResult[]> {
  const {
    concurrency = 2000,
    enableCatchAll = true,
    enableCache = true,
    onProgress
  } = options

  const results: VerificationResult[] = []
  const startTime = Date.now()
  let processedCount = 0

  // Group emails by domain for better cache utilization
  const domainGroups = groupEmailsByDomain(emails)
  const sortedDomains = Array.from(domainGroups.keys()).sort(
    (a, b) => domainGroups.get(b)!.length - domainGroups.get(a)!.length
  )

  // Flatten back to email list but domain-grouped
  const sortedEmails: string[] = []
  sortedDomains.forEach(domain => {
    sortedEmails.push(...domainGroups.get(domain)!)
  })

  // Process in batches with concurrency limit
  for (let i = 0; i < sortedEmails.length; i += concurrency) {
    const batch = sortedEmails.slice(i, i + concurrency)
    
    const batchResults = await Promise.all(
      batch.map(email => verifyEmail(email, enableCatchAll, enableCache))
    )
    
    results.push(...batchResults)
    processedCount += batch.length

    // Report progress
    if (onProgress) {
      const elapsedSeconds = (Date.now() - startTime) / 1000
      const speed = processedCount / elapsedSeconds
      const validCount = results.filter(r => r.valid).length
      const invalidCount = results.filter(r => !r.valid).length

      onProgress({
        processed: processedCount,
        total: sortedEmails.length,
        percentage: Math.round((processedCount / sortedEmails.length) * 100),
        speed: Math.round(speed * 10) / 10,
        currentEmail: batch[batch.length - 1],
        valid: validCount,
        invalid: invalidCount
      })
    }
  }

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
