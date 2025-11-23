"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dnsCache = void 0;
const dns_1 = __importDefault(require("dns"));
class DNSCache {
    constructor(defaultTTL = 300000) {
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
        // Clean up expired entries every 5 minutes
        setInterval(() => this.cleanup(), 300000);
    }
    async getMxRecords(domain) {
        const cached = this.cache.get(domain);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return cached.mxRecords;
        }
        // Cache miss or expired - fetch fresh data
        try {
            const { promisify } = require('util');
            const resolveMx = promisify(dns_1.default.resolveMx);
            const mxRecords = await resolveMx(domain);
            this.cache.set(domain, {
                mxRecords,
                timestamp: Date.now(),
                ttl: this.defaultTTL
            });
            return mxRecords;
        }
        catch (error) {
            // Cache the failure too (with shorter TTL)
            this.cache.set(domain, {
                mxRecords: null,
                timestamp: Date.now(),
                ttl: 60000 // 1 minute for failures
            });
            return null;
        }
    }
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];
        this.cache.forEach((entry, domain) => {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(domain);
            }
        });
        keysToDelete.forEach(domain => this.cache.delete(domain));
    }
    clear() {
        this.cache.clear();
    }
    getStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}
// Export singleton instance
exports.dnsCache = new DNSCache();
//# sourceMappingURL=dns-cache.js.map