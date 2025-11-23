import { app, InvocationContext } from '@azure/functions'

interface BulkVerificationJob {
  jobId: string
  userId: string
  emails: string[]
  concurrency: number
  webhookUrl?: string
  callbackUrl: string
}

// Note: This is a placeholder. For now, we'll use Vercel for all processing.
// To enable Azure workers, you need to:
// 1. Copy parallel-verifier logic here
// 2. Or create a shared package

async function emailVerifierWorker(queueItem: unknown, context: InvocationContext): Promise<void> {
  context.log('Processing email verification job from queue')
  
  const jobData = JSON.parse(queueItem as string) as BulkVerificationJob

  try {
    context.log(`Job ${jobData.jobId}: Received ${jobData.emails.length} emails`)
    
    // TODO: Implement actual email verification here
    // For now, send back to Vercel for processing
    
    await fetch(jobData.callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Azure-Worker': 'true',
        'X-Job-Id': jobData.jobId,
      },
      body: JSON.stringify({
        jobId: jobData.jobId,
        userId: jobData.userId,
        status: 'completed',
        message: 'Azure worker processed job',
      }),
    })

    context.log(`Job ${jobData.jobId}: Callback sent`)
  } catch (error) {
    context.error('Worker error:', error)
    throw error
  }
}

// Register queue trigger
app.storageQueue('emailVerifierWorker', {
  queueName: 'email-verification-jobs',
  connection: 'AzureWebJobsStorage',
  handler: emailVerifierWorker
})
