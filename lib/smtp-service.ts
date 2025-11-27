/**
 * SMTP Service Client
 * Connects to the SMTP microservice for port 25 verification
 */

const SMTP_SERVICE_URL = process.env.SMTP_SERVICE_URL || 'http://localhost:3001'
const SMTP_SERVICE_API_KEY = process.env.SMTP_SERVICE_API_KEY || ''

interface SMTPVerificationResult {
  email: string
  smtp: boolean
  catch_all: boolean
  smtp_provider: string | null
  connected: boolean
  mx_servers?: number
  error?: string | null
}

interface BulkSMTPResult {
  results: SMTPVerificationResult[]
  total: number
}

/**
 * Verify a single email via the SMTP microservice
 */
export async function verifySMTP(email: string): Promise<SMTPVerificationResult> {
  try {
    const response = await fetch(`${SMTP_SERVICE_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SMTP_SERVICE_API_KEY
      },
      body: JSON.stringify({ email })
    })

    if (!response.ok) {
      throw new Error(`SMTP service error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('SMTP service error:', error)
    // Return fallback result if service is unavailable
    return {
      email,
      smtp: false,
      catch_all: false,
      smtp_provider: null,
      connected: false,
      error: error instanceof Error ? error.message : 'Service unavailable'
    }
  }
}

/**
 * Verify multiple emails via the SMTP microservice
 */
export async function verifySMTPBulk(emails: string[]): Promise<BulkSMTPResult> {
  try {
    // Split into batches of 100
    const batches: string[][] = []
    for (let i = 0; i < emails.length; i += 100) {
      batches.push(emails.slice(i, i + 100))
    }

    const allResults: SMTPVerificationResult[] = []

    for (const batch of batches) {
      const response = await fetch(`${SMTP_SERVICE_URL}/verify-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': SMTP_SERVICE_API_KEY
        },
        body: JSON.stringify({ emails: batch })
      })

      if (!response.ok) {
        throw new Error(`SMTP service error: ${response.status}`)
      }

      const result: BulkSMTPResult = await response.json()
      allResults.push(...result.results)
    }

    return {
      results: allResults,
      total: allResults.length
    }
  } catch (error) {
    console.error('SMTP bulk service error:', error)
    // Return fallback results if service is unavailable
    return {
      results: emails.map(email => ({
        email,
        smtp: false,
        catch_all: false,
        smtp_provider: null,
        connected: false,
        error: error instanceof Error ? error.message : 'Service unavailable'
      })),
      total: emails.length
    }
  }
}

/**
 * Check if the SMTP service is available
 */
export async function checkSMTPServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SMTP_SERVICE_URL}/health`, {
      method: 'GET'
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Test if port 25 is available on the SMTP service
 */
export async function testPort25(): Promise<{ available: boolean; message: string }> {
  try {
    const response = await fetch(`${SMTP_SERVICE_URL}/test-port25`, {
      method: 'GET'
    })
    const result = await response.json()
    return {
      available: result.port25Available,
      message: result.message
    }
  } catch (error) {
    return {
      available: false,
      message: 'SMTP service unavailable'
    }
  }
}
