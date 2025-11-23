// SMTP connection pool for efficient bulk email verification
// Reuses connections and manages concurrent verification requests

import net from 'net'

interface PoolConnection {
  socket: net.Socket | null
  busy: boolean
  lastUsed: number
  domain: string
}

class SMTPConnectionPool {
  private pool: Map<string, PoolConnection[]> = new Map()
  private maxConnectionsPerDomain: number = 3
  private connectionTimeout: number = 30000 // 30 seconds idle timeout

  constructor() {
    // Cleanup idle connections every minute
    setInterval(() => this.cleanupIdleConnections(), 60000)
  }

  private cleanupIdleConnections() {
    const now = Date.now()
    this.pool.forEach((connections, domain) => {
      const activeConnections = connections.filter(conn => {
        if (!conn.busy && now - conn.lastUsed > this.connectionTimeout) {
          conn.socket?.destroy()
          return false
        }
        return true
      })
      
      if (activeConnections.length === 0) {
        this.pool.delete(domain)
      } else {
        this.pool.set(domain, activeConnections)
      }
    })
  }

  async getConnection(domain: string, port: number = 25): Promise<net.Socket> {
    let domainConnections = this.pool.get(domain) || []
    
    // Try to find an available connection
    const availableConn = domainConnections.find(c => !c.busy && c.socket)
    if (availableConn && availableConn.socket) {
      availableConn.busy = true
      availableConn.lastUsed = Date.now()
      return availableConn.socket
    }

    // Create new connection if under limit
    if (domainConnections.length < this.maxConnectionsPerDomain) {
      const socket = net.createConnection(port, domain)
      const connection: PoolConnection = {
        socket,
        busy: true,
        lastUsed: Date.now(),
        domain
      }
      
      domainConnections.push(connection)
      this.pool.set(domain, domainConnections)
      
      return socket
    }

    // Wait for an available connection
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const conns = this.pool.get(domain) || []
        const available = conns.find(c => !c.busy && c.socket)
        if (available && available.socket) {
          available.busy = true
          available.lastUsed = Date.now()
          clearInterval(checkInterval)
          resolve(available.socket)
        }
      }, 100)
    })
  }

  releaseConnection(domain: string, socket: net.Socket) {
    const connections = this.pool.get(domain)
    if (connections) {
      const conn = connections.find(c => c.socket === socket)
      if (conn) {
        conn.busy = false
        conn.lastUsed = Date.now()
      }
    }
  }

  destroyConnection(domain: string, socket: net.Socket) {
    const connections = this.pool.get(domain)
    if (connections) {
      const index = connections.findIndex(c => c.socket === socket)
      if (index !== -1) {
        connections[index].socket?.destroy()
        connections.splice(index, 1)
        if (connections.length === 0) {
          this.pool.delete(domain)
        } else {
          this.pool.set(domain, connections)
        }
      }
    }
  }

  getStats() {
    let totalConnections = 0
    let busyConnections = 0
    
    this.pool.forEach(connections => {
      totalConnections += connections.length
      busyConnections += connections.filter(c => c.busy).length
    })

    return {
      domains: this.pool.size,
      totalConnections,
      busyConnections,
      idleConnections: totalConnections - busyConnections
    }
  }

  destroy() {
    this.pool.forEach(connections => {
      connections.forEach(conn => conn.socket?.destroy())
    })
    this.pool.clear()
  }
}

export const smtpPool = new SMTPConnectionPool()
