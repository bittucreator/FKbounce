import { WebSocket, WebSocketServer } from 'ws'
import { IncomingMessage } from 'http'

interface ProgressUpdate {
  jobId: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  processed: number
  total: number
  currentEmail?: string
  estimatedTimeRemaining?: number
}

// Map to store WebSocket connections for each job
const jobConnections = new Map<string, Set<WebSocket>>()

// Map to store progress data for each job
const jobProgress = new Map<string, ProgressUpdate>()

/**
 * Subscribe a WebSocket connection to job progress updates
 */
export function subscribeToJob(jobId: string, ws: WebSocket) {
  if (!jobConnections.has(jobId)) {
    jobConnections.set(jobId, new Set())
  }
  jobConnections.get(jobId)!.add(ws)

  // Send current progress if available
  const currentProgress = jobProgress.get(jobId)
  if (currentProgress) {
    ws.send(JSON.stringify(currentProgress))
  }

  // Clean up on disconnect
  ws.on('close', () => {
    jobConnections.get(jobId)?.delete(ws)
    if (jobConnections.get(jobId)?.size === 0) {
      jobConnections.delete(jobId)
    }
  })
}

/**
 * Unsubscribe a WebSocket connection from job updates
 */
export function unsubscribeFromJob(jobId: string, ws: WebSocket) {
  jobConnections.get(jobId)?.delete(ws)
  if (jobConnections.get(jobId)?.size === 0) {
    jobConnections.delete(jobId)
  }
}

/**
 * Broadcast progress update to all subscribers
 */
export function broadcastProgress(update: ProgressUpdate) {
  // Store the progress
  jobProgress.set(update.jobId, update)

  // Broadcast to all connected clients for this job
  const connections = jobConnections.get(update.jobId)
  if (connections) {
    const message = JSON.stringify(update)
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message)
      }
    })
  }

  // Clean up completed/failed jobs after 5 minutes
  if (update.status === 'completed' || update.status === 'failed') {
    setTimeout(() => {
      jobProgress.delete(update.jobId)
      jobConnections.delete(update.jobId)
    }, 5 * 60 * 1000)
  }
}

/**
 * Update job progress (convenience function)
 */
export function updateJobProgress(
  jobId: string,
  processed: number,
  total: number,
  currentEmail?: string
) {
  const progress = Math.round((processed / total) * 100)
  const remainingEmails = total - processed
  const avgTimePerEmail = 1.5 // seconds, estimate
  const estimatedTimeRemaining = Math.round(remainingEmails * avgTimePerEmail)

  broadcastProgress({
    jobId,
    status: 'processing',
    progress,
    processed,
    total,
    currentEmail,
    estimatedTimeRemaining
  })
}

/**
 * Mark job as completed
 */
export function completeJob(jobId: string, total: number) {
  broadcastProgress({
    jobId,
    status: 'completed',
    progress: 100,
    processed: total,
    total,
    estimatedTimeRemaining: 0
  })
}

/**
 * Mark job as failed
 */
export function failJob(jobId: string, processed: number, total: number) {
  broadcastProgress({
    jobId,
    status: 'failed',
    progress: Math.round((processed / total) * 100),
    processed,
    total
  })
}

/**
 * Get current progress for a job
 */
export function getJobProgress(jobId: string): ProgressUpdate | undefined {
  return jobProgress.get(jobId)
}

/**
 * Check if job has active subscribers
 */
export function hasSubscribers(jobId: string): boolean {
  const connections = jobConnections.get(jobId)
  return connections ? connections.size > 0 : false
}
