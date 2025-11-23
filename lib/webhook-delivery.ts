import crypto from 'crypto'

export interface WebhookPayload {
  event: string
  job_id: string
  timestamp: string
  data: any
}

export interface WebhookConfig {
  id: string
  url: string
  secret: string
  events: string[]
  is_active: boolean
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Deliver webhook to configured URL
 */
export async function deliverWebhook(
  config: WebhookConfig,
  payload: WebhookPayload,
  maxRetries: number = 3
): Promise<{
  success: boolean
  statusCode?: number
  responseBody?: string
  error?: string
}> {
  if (!config.is_active) {
    return { success: false, error: 'Webhook is inactive' }
  }

  if (!config.events.includes(payload.event)) {
    return { success: false, error: 'Event not subscribed' }
  }

  const payloadString = JSON.stringify(payload)
  const signature = generateWebhookSignature(payloadString, config.secret)

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
          'User-Agent': 'FKbounce-Webhook/1.0',
        },
        body: payloadString,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      const responseBody = await response.text()

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status,
          responseBody,
        }
      }

      // If not the last attempt and got a 5xx error, retry
      if (attempt < maxRetries - 1 && response.status >= 500) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      return {
        success: false,
        statusCode: response.status,
        responseBody,
        error: `HTTP ${response.status}`,
      }
    } catch (error) {
      // If not the last attempt, retry
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  return { success: false, error: 'Max retries exceeded' }
}
