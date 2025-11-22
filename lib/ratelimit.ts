// Simple in-memory rate limiter for serverless functions
// Stores request counts per user/IP with automatic cleanup

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const store: RateLimitStore = {}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetAt < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  limit: number // Maximum requests
  window: number // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now()
  const key = `ratelimit:${identifier}`
  
  // Get or create entry
  let entry = store[key]
  
  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.window
    }
    store[key] = entry
  }
  
  // Check if limit exceeded
  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: entry.resetAt
    }
  }
  
  // Increment count
  entry.count++
  
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    reset: entry.resetAt
  }
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // API endpoints - Free users: 120 req/min, Pro users: 600 req/min
  apiFree: {
    limit: 120,
    window: 60 * 1000 // 1 minute
  },
  apiPro: {
    limit: 600,
    window: 60 * 1000 // 1 minute
  },
  // IP-based for unauthenticated - 20 requests per minute
  ip: {
    limit: 20,
    window: 60 * 1000 // 1 minute
  },
  // Webhook - 100 requests per minute
  webhook: {
    limit: 100,
    window: 60 * 1000 // 1 minute
  }
}
