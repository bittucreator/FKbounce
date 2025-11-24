import { createHmac } from 'crypto'

export type WebhookEvent = 
  | 'VERIFICATION_COMPLETED'
  | 'VERIFICATION_FAILED'
  | 'BATCH_COMPLETED'
  | 'BATCH_PROGRESS'
  | 'QUOTA_WARNING'
  | 'QUOTA_EXCEEDED'

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: any
}

export interface WebhookConfig {
  id: string
  url: string
  secret: string
  events: WebhookEvent[]
  active: boolean
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  return `sha256=${hmac.digest('hex')}`
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
  return signature === expectedSignature
}

/**
 * Deliver webhook with retry logic
 */
export async function deliverWebhook(
  config: WebhookConfig,
  payload: WebhookPayload,
  retryCount = 0
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  // Skip if webhook doesn't listen for this event
  if (!config.events.includes(payload.event)) {
    return { success: true }
  }

  // Skip if webhook is not active
  if (!config.active) {
    return { success: false, error: 'Webhook is not active' }
  }

  const payloadString = JSON.stringify(payload)
  const signature = generateWebhookSignature(payloadString, config.secret)

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-ID': config.id,
        'User-Agent': 'FKbounce-Webhook/1.0'
      },
      body: payloadString,
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    if (response.ok) {
      return { success: true, statusCode: response.status }
    }

    // Retry on 5xx errors
    if (response.status >= 500 && retryCount < 3) {
      const delay = getRetryDelay(retryCount)
      await sleep(delay)
      return deliverWebhook(config, payload, retryCount + 1)
    }

    return {
      success: false,
      statusCode: response.status,
      error: `HTTP ${response.status}: ${response.statusText}`
    }
  } catch (error) {
    // Retry on network errors
    if (retryCount < 3) {
      const delay = getRetryDelay(retryCount)
      await sleep(delay)
      return deliverWebhook(config, payload, retryCount + 1)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Calculate retry delay with exponential backoff
 * Retry 1: immediate
 * Retry 2: 30 seconds
 * Retry 3: 5 minutes
 */
function getRetryDelay(retryCount: number): number {
  switch (retryCount) {
    case 0:
      return 0
    case 1:
      return 30 * 1000 // 30 seconds
    case 2:
      return 5 * 60 * 1000 // 5 minutes
    default:
      return 0
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Send webhook for verification completed
 */
export async function sendVerificationWebhook(
  webhooks: WebhookConfig[],
  verificationResult: any
) {
  const payload: WebhookPayload = {
    event: verificationResult.is_valid 
      ? 'VERIFICATION_COMPLETED' 
      : 'VERIFICATION_FAILED',
    timestamp: new Date().toISOString(),
    data: verificationResult
  }

  const results = await Promise.all(
    webhooks.map(webhook => deliverWebhook(webhook, payload))
  )

  return results
}

/**
 * Send webhook for batch completed
 */
export async function sendBatchWebhook(
  webhooks: WebhookConfig[],
  jobId: string,
  results: any[]
) {
  const payload: WebhookPayload = {
    event: 'BATCH_COMPLETED',
    timestamp: new Date().toISOString(),
    data: {
      jobId,
      totalEmails: results.length,
      validEmails: results.filter(r => r.is_valid).length,
      invalidEmails: results.filter(r => !r.is_valid).length,
      results
    }
  }

  const deliveryResults = await Promise.all(
    webhooks.map(webhook => deliverWebhook(webhook, payload))
  )

  return deliveryResults
}

/**
 * Send webhook for batch progress
 */
export async function sendBatchProgressWebhook(
  webhooks: WebhookConfig[],
  jobId: string,
  processed: number,
  total: number
) {
  const payload: WebhookPayload = {
    event: 'BATCH_PROGRESS',
    timestamp: new Date().toISOString(),
    data: {
      jobId,
      processed,
      total,
      progress: Math.round((processed / total) * 100)
    }
  }

  const results = await Promise.all(
    webhooks.map(webhook => deliverWebhook(webhook, payload))
  )

  return results
}

/**
 * Send webhook for quota warning
 */
export async function sendQuotaWarningWebhook(
  webhooks: WebhookConfig[],
  remaining: number,
  quota: number
) {
  const payload: WebhookPayload = {
    event: 'QUOTA_WARNING',
    timestamp: new Date().toISOString(),
    data: {
      remaining,
      quota,
      percentageRemaining: Math.round((remaining / quota) * 100)
    }
  }

  const results = await Promise.all(
    webhooks.map(webhook => deliverWebhook(webhook, payload))
  )

  return results
}

/**
 * Send webhook for quota exceeded
 */
export async function sendQuotaExceededWebhook(
  webhooks: WebhookConfig[],
  quota: number
) {
  const payload: WebhookPayload = {
    event: 'QUOTA_EXCEEDED',
    timestamp: new Date().toISOString(),
    data: {
      quota,
      message: 'API quota has been exceeded. Please upgrade your plan.'
    }
  }

  const results = await Promise.all(
    webhooks.map(webhook => deliverWebhook(webhook, payload))
  )

  return results
}
