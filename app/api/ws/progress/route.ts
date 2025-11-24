import { NextRequest } from 'next/server'
import { WebSocket } from 'ws'
import { subscribeToJob } from '@/lib/websocket/progress-manager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return new Response('Job ID is required', { status: 400 })
  }

  // Create WebSocket upgrade
  const upgradeHeader = request.headers.get('upgrade')
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 })
  }

  try {
    // For Next.js API routes, we need to use the underlying Node.js response
    // This is a simplified implementation - production would need proper WebSocket server
    const ws = new WebSocket(request.url.replace('http', 'ws'))
    
    subscribeToJob(jobId, ws)

    return new Response(null, {
      status: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
      },
    })
  } catch (error) {
    console.error('WebSocket error:', error)
    return new Response('WebSocket connection failed', { status: 500 })
  }
}
