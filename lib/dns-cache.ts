import dns from 'dns'

interface CacheEntry {
  mxRecords: dns.MxRecord[] | null
  timestamp: number
  ttl: number
}

class DNSCache {
  private cache: Map<string, CacheEntry>
  private defaultTTL: number

  constructor(defaultTTL: number = 300000) { // 5 minutes default
    this.cache = new Map()
    this.defaultTTL = defaultTTL
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 300000)
  }

  async getMxRecords(domain: string): Promise<dns.MxRecord[] | null> {
    const cached = this.cache.get(domain)
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.mxRecords
    }
    
    // Cache miss or expired - fetch fresh data
    try {
      const { promisify } = require('util')
      const resolveMx = promisify(dns.resolveMx)
      const mxRecords = await resolveMx(domain)
      
      this.cache.set(domain, {
        mxRecords,
        timestamp: Date.now(),
        ttl: this.defaultTTL
      })
      
      return mxRecords
    } catch (error) {
      // Cache the failure too (with shorter TTL)
      this.cache.set(domain, {
        mxRecords: null,
        timestamp: Date.now(),
        ttl: 60000 // 1 minute for failures
      })
      
      return null
    }
  }

  cleanup() {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((entry, domain) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(domain)
      }
    })
    
    keysToDelete.forEach(domain => this.cache.delete(domain))
  }

  clear() {
    this.cache.clear()
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const dnsCache = new DNSCache()
