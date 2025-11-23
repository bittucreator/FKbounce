// Azure Queue Storage client for offloading verification jobs
import { QueueClient, QueueServiceClient } from '@azure/storage-queue'

interface BulkVerificationJob {
  jobId: string
  userId: string
  emails: string[]
  concurrency: number
  webhookUrl?: string
  callbackUrl: string // Vercel endpoint to receive results
}

class AzureWorkerClient {
  private queueClient: QueueClient | null = null
  private enabled: boolean = false

  constructor() {
    // Enable Azure workers if connection string is configured
    if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
      try {
        const serviceClient = QueueServiceClient.fromConnectionString(
          process.env.AZURE_STORAGE_CONNECTION_STRING
        )
        this.queueClient = serviceClient.getQueueClient('email-verification-jobs')
        this.enabled = true
      } catch (error) {
        console.error('Failed to initialize Azure Queue:', error)
      }
    }
  }

  isEnabled(): boolean {
    return this.enabled && this.queueClient !== null
  }

  async enqueueJob(job: BulkVerificationJob): Promise<{ success: boolean; messageId?: string }> {
    if (!this.queueClient) {
      return { success: false }
    }

    try {
      // Create queue if it doesn't exist
      await this.queueClient.createIfNotExists()

      // Encode job as base64
      const messageText = Buffer.from(JSON.stringify(job)).toString('base64')
      
      // Send message to queue
      const response = await this.queueClient.sendMessage(messageText)
      
      return {
        success: true,
        messageId: response.messageId,
      }
    } catch (error) {
      console.error('Failed to enqueue job:', error)
      return { success: false }
    }
  }

  async getQueueLength(): Promise<number> {
    if (!this.queueClient) {
      return 0
    }

    try {
      const properties = await this.queueClient.getProperties()
      return properties.approximateMessagesCount || 0
    } catch (error) {
      console.error('Failed to get queue length:', error)
      return 0
    }
  }
}

// Singleton instance
export const azureWorkerClient = new AzureWorkerClient()

// Helper to determine if job should use Azure workers
export function shouldUseAzureWorkers(emailCount: number): boolean {
  // Use Azure for jobs with 10K+ emails
  return azureWorkerClient.isEnabled() && emailCount >= 10000
}
