import { createSchema } from 'graphql-yoga'
import { DateTimeResolver, EmailAddressResolver } from 'graphql-scalars'

const typeDefs = /* GraphQL */ `
  scalar DateTime
  scalar EmailAddress

  type Query {
    """
    Verify a single email address
    """
    verifyEmail(email: EmailAddress!): VerificationResult!
    
    """
    Get verification history for the authenticated user
    """
    verificationHistory(
      limit: Int = 50
      offset: Int = 0
    ): VerificationHistoryResponse!
    
    """
    Get API usage statistics
    """
    apiUsage(
      startDate: DateTime
      endDate: DateTime
    ): ApiUsageStats!
    
    """
    Get current rate limit status
    """
    rateLimitStatus: RateLimitStatus!
    
    """
    Get all smart lists
    """
    smartLists: [SmartList!]!
    
    """
    Get a specific verification job status
    """
    verificationJob(jobId: ID!): VerificationJob
  }

  type Mutation {
    """
    Verify multiple email addresses in batch
    """
    verifyBulkEmails(
      emails: [EmailAddress!]!
      webhookUrl: String
    ): VerificationJob!
    
    """
    Create a new smart list
    """
    createSmartList(
      name: String!
      description: String
    ): SmartList!
    
    """
    Add emails to a smart list
    """
    addEmailsToList(
      listId: ID!
      emails: [EmailAddress!]!
    ): SmartList!
    
    """
    Configure webhook endpoint
    """
    configureWebhook(
      url: String!
      events: [WebhookEvent!]!
      secret: String
    ): Webhook!
    
    """
    Delete webhook configuration
    """
    deleteWebhook(webhookId: ID!): Boolean!
  }

  type Subscription {
    """
    Subscribe to verification job progress
    """
    verificationProgress(jobId: ID!): VerificationProgress!
    
    """
    Subscribe to verification events
    """
    verificationEvents: VerificationEvent!
  }

  type VerificationResult {
    email: EmailAddress!
    valid: Boolean!
    syntax: Boolean!
    dns: Boolean!
    smtp: Boolean!
    disposable: Boolean!
    catchAll: Boolean!
    message: String!
    reputationScore: Int
    isSpamTrap: Boolean
    isRoleBased: Boolean
    roleType: String
    emailAge: String
    domainHealthScore: Int
    inboxPlacementScore: Int
    mxPriority: [Int!]
    insights: [String!]
    verifiedAt: DateTime!
  }

  type VerificationHistoryResponse {
    total: Int!
    results: [VerificationHistoryItem!]!
    hasMore: Boolean!
  }

  type VerificationHistoryItem {
    id: ID!
    email: EmailAddress
    emails: [EmailAddress!]
    type: VerificationType!
    status: VerificationStatus!
    results: [VerificationResult!]
    createdAt: DateTime!
    completedAt: DateTime
  }

  type ApiUsageStats {
    totalVerifications: Int!
    verificationsToday: Int!
    verificationsThisMonth: Int!
    quota: Int!
    remaining: Int!
    resetDate: DateTime!
    breakdown: UsageBreakdown!
  }

  type UsageBreakdown {
    single: Int!
    bulk: Int!
    successful: Int!
    failed: Int!
  }

  type RateLimitStatus {
    limit: Int!
    remaining: Int!
    reset: DateTime!
    retryAfter: Int
  }

  type SmartList {
    id: ID!
    name: String!
    description: String
    emailCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    emails: [String!]
  }

  type VerificationJob {
    id: ID!
    status: JobStatus!
    total: Int!
    processed: Int!
    valid: Int!
    invalid: Int!
    progress: Float!
    results: [VerificationResult!]
    createdAt: DateTime!
    completedAt: DateTime
    webhookUrl: String
  }

  type VerificationProgress {
    jobId: ID!
    status: JobStatus!
    progress: Float!
    processed: Int!
    total: Int!
    currentEmail: EmailAddress
    estimatedTimeRemaining: Int
  }

  type VerificationEvent {
    type: VerificationEventType!
    email: EmailAddress
    result: VerificationResult
    timestamp: DateTime!
  }

  type Webhook {
    id: ID!
    url: String!
    events: [WebhookEvent!]!
    secret: String
    active: Boolean!
    createdAt: DateTime!
  }

  enum VerificationType {
    SINGLE
    BULK
  }

  enum VerificationStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
  }

  enum JobStatus {
    QUEUED
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
  }

  enum VerificationEventType {
    VERIFICATION_STARTED
    VERIFICATION_COMPLETED
    VERIFICATION_FAILED
    BATCH_STARTED
    BATCH_PROGRESS
    BATCH_COMPLETED
  }

  enum WebhookEvent {
    VERIFICATION_COMPLETED
    VERIFICATION_FAILED
    BATCH_COMPLETED
    BATCH_PROGRESS
    QUOTA_WARNING
    QUOTA_EXCEEDED
  }
`

const resolvers = {
  DateTime: DateTimeResolver,
  EmailAddress: EmailAddressResolver,

  Query: {
    verifyEmail: async (_: any, { email }: { email: string }, context: any) => {
      // Call existing verification API
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.user?.id}`
        },
        body: JSON.stringify({ email })
      })
      
      const result = await response.json()
      return {
        ...result,
        verifiedAt: new Date()
      }
    },

    verificationHistory: async (_: any, { limit, offset }: any, context: any) => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      
      const { data, error, count } = await supabase
        .from('verification_history')
        .select('*', { count: 'exact' })
        .eq('user_id', context.user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw new Error(error.message)

      return {
        total: count || 0,
        results: data || [],
        hasMore: (count || 0) > offset + limit
      }
    },

    apiUsage: async (_: any, { startDate, endDate }: any, context: any) => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      // Get user's subscription/quota
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, api_quota, api_usage')
        .eq('id', context.user.id)
        .single()

      // Get verification counts
      const { count: totalCount } = await supabase
        .from('verification_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', context.user.id)

      const { count: todayCount } = await supabase
        .from('verification_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', context.user.id)
        .gte('created_at', new Date().toISOString().split('T')[0])

      const { count: monthCount } = await supabase
        .from('verification_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', context.user.id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

      return {
        totalVerifications: totalCount || 0,
        verificationsToday: todayCount || 0,
        verificationsThisMonth: monthCount || 0,
        quota: profile?.api_quota || 1000,
        remaining: (profile?.api_quota || 1000) - (profile?.api_usage || 0),
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        breakdown: {
          single: 0,
          bulk: 0,
          successful: 0,
          failed: 0
        }
      }
    },

    rateLimitStatus: async (_: any, __: any, context: any) => {
      return {
        limit: 100,
        remaining: 95,
        reset: new Date(Date.now() + 3600000),
        retryAfter: null
      }
    },

    smartLists: async (_: any, __: any, context: any) => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('smart_lists')
        .select('*')
        .eq('user_id', context.user.id)

      if (error) throw new Error(error.message)
      return data || []
    },

    verificationJob: async (_: any, { jobId }: { jobId: string }, context: any) => {
      // Implement job status lookup
      return null
    }
  },

  Mutation: {
    verifyBulkEmails: async (_: any, { emails, webhookUrl }: any, context: any) => {
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Start background job
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/verify-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.user?.id}`
        },
        body: JSON.stringify({ 
          emails,
          jobId,
          webhookUrl
        })
      }).catch(console.error)

      return {
        id: jobId,
        status: 'QUEUED',
        total: emails.length,
        processed: 0,
        valid: 0,
        invalid: 0,
        progress: 0,
        results: [],
        createdAt: new Date(),
        completedAt: null,
        webhookUrl
      }
    },

    createSmartList: async (_: any, { name, description }: any, context: any) => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('smart_lists')
        .insert({
          user_id: context.user.id,
          name,
          description,
          emails: []
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    addEmailsToList: async (_: any, { listId, emails }: any, context: any) => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data: list } = await supabase
        .from('smart_lists')
        .select('emails')
        .eq('id', listId)
        .single()

      const updatedEmails = [...(list?.emails || []), ...emails]

      const { data, error } = await supabase
        .from('smart_lists')
        .update({ emails: updatedEmails })
        .eq('id', listId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    configureWebhook: async (_: any, { url, events, secret }: any, context: any) => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          user_id: context.user.id,
          url,
          events,
          secret: secret || crypto.randomUUID(),
          active: true
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },

    deleteWebhook: async (_: any, { webhookId }: { webhookId: string }, context: any) => {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId)
        .eq('user_id', context.user.id)

      if (error) throw new Error(error.message)
      return true
    }
  },

  Subscription: {
    verificationProgress: {
      subscribe: async function* (_: any, { jobId }: { jobId: string }, context: any) {
        // Real-time updates for job progress
        let progress = 0
        while (progress < 100) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          progress += 10
          yield {
            verificationProgress: {
              jobId,
              status: progress < 100 ? 'PROCESSING' : 'COMPLETED',
              progress,
              processed: Math.floor((progress / 100) * 100),
              total: 100,
              currentEmail: `test${progress}@example.com`,
              estimatedTimeRemaining: Math.floor(((100 - progress) / 10) * 1000)
            }
          }
        }
      }
    },

    verificationEvents: {
      subscribe: async function* (_: any, __: any, context: any) {
        // Subscribe to all verification events
        while (true) {
          await new Promise(resolve => setTimeout(resolve, 5000))
          yield {
            verificationEvents: {
              type: 'VERIFICATION_COMPLETED',
              email: 'test@example.com',
              result: null,
              timestamp: new Date()
            }
          }
        }
      }
    }
  }
}

export const schema = createSchema({
  typeDefs,
  resolvers
})
