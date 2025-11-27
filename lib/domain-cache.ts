// Domain verification cache to reduce redundant DNS/SMTP checks
// Caches domain verification results for 1 hour

interface DomainCacheEntry {
  dns: boolean
  smtp: boolean
  catch_all: boolean
  smtp_provider?: string
  mxRecords: any[]
  timestamp: number
}

interface DomainCacheStore {
  [domain: string]: DomainCacheEntry
}

const domainCache: DomainCacheStore = {}
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

// Cleanup expired entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(domainCache).forEach(domain => {
    if (now - domainCache[domain].timestamp > CACHE_TTL) {
      delete domainCache[domain]
    }
  })
}, 10 * 60 * 1000)

export function getDomainCache(domain: string): DomainCacheEntry | null {
  const entry = domainCache[domain]
  if (!entry) return null
  
  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    delete domainCache[domain]
    return null
  }
  
  return entry
}

export function setDomainCache(
  domain: string,
  dns: boolean,
  smtp: boolean,
  catch_all: boolean,
  mxRecords: any[],
  smtp_provider?: string
): void {
  domainCache[domain] = {
    dns,
    smtp,
    catch_all,
    smtp_provider,
    mxRecords,
    timestamp: Date.now()
  }
}

export function clearDomainCache(): void {
  Object.keys(domainCache).forEach(key => delete domainCache[key])
}

export function getDomainCacheStats() {
  return {
    totalDomains: Object.keys(domainCache).length,
    oldestEntry: Math.min(...Object.values(domainCache).map(e => e.timestamp)),
    newestEntry: Math.max(...Object.values(domainCache).map(e => e.timestamp))
  }
}
