// Zapier Integration Configuration
// This defines the structure for the Zapier app integration

export const zapierConfig = {
  // Basic App Info
  app: {
    key: 'fkbounce',
    name: 'FKbounce Email Verifier',
    version: '1.0.0',
    description: 'Verify email addresses, clean email lists, and improve deliverability with FKbounce.',
    homepage_url: 'https://fkbounce.com',
    logo_url: 'https://fkbounce.com/logo.png',
    category: 'Marketing Automation',
  },

  // Authentication
  authentication: {
    type: 'api_key',
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        required: true,
        type: 'password',
        helpText: 'Get your API key from the API Keys page in your FKbounce dashboard at https://fkbounce.com/api-keys. Click "Generate New Key" if you don\'t have one yet.',
        computed: false,
        inputFormat: 'fkb_{{input}}',
      },
    ],
    test: {
      url: '{{process.env.NEXT_PUBLIC_APP_URL}}/api/zapier/test',
      method: 'GET',
      headers: {
        'X-API-Key': '{{bundle.authData.api_key}}',
      },
    },
  },

  // Triggers (when something happens in FKbounce)
  triggers: [
    {
      key: 'email_verified',
      noun: 'Email',
      display: {
        label: 'Email Verified',
        description: 'Triggers when an email is verified (single or bulk).',
      },
      operation: {
        type: 'polling',
        perform: {
          url: '{{process.env.NEXT_PUBLIC_APP_URL}}/api/zapier/triggers/email-verified',
          method: 'GET',
          headers: {
            'X-API-Key': '{{bundle.authData.api_key}}',
          },
          params: {
            since: '{{bundle.meta.page}}',
          },
        },
      },
      sample: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        isValid: true,
        reason: 'Valid email address',
        syntax: { isValid: true },
        dns: { isValid: true, hasMxRecords: true },
        smtp: { isValid: true },
        isDisposable: false,
        isFreeProvider: true,
        verifiedAt: '2024-11-24T10:00:00Z',
      },
    },
    {
      key: 'bulk_job_completed',
      noun: 'Bulk Job',
      display: {
        label: 'Bulk Job Completed',
        description: 'Triggers when a bulk verification job is completed.',
      },
      operation: {
        type: 'polling',
        perform: {
          url: '{{process.env.NEXT_PUBLIC_APP_URL}}/api/zapier/triggers/bulk-completed',
          method: 'GET',
          headers: {
            'X-API-Key': '{{bundle.authData.api_key}}',
          },
        },
      },
      sample: {
        id: 'job-123',
        status: 'completed',
        totalEmails: 100,
        validEmails: 85,
        invalidEmails: 15,
        completedAt: '2024-11-24T10:30:00Z',
      },
    },
  ],

  // Actions (what Zapier can do in FKbounce)
  actions: [
    {
      key: 'verify_email',
      noun: 'Email',
      display: {
        label: 'Verify Single Email',
        description: 'Verify a single email address.',
      },
      operation: {
        perform: {
          url: '{{process.env.NEXT_PUBLIC_APP_URL}}/api/zapier/actions/verify-email',
          method: 'POST',
          headers: {
            'X-API-Key': '{{bundle.authData.api_key}}',
            'Content-Type': 'application/json',
          },
          body: {
            email: '{{bundle.inputData.email}}',
          },
        },
      },
      inputFields: [
        {
          key: 'email',
          label: 'Email Address',
          type: 'string',
          required: true,
          helpText: 'The email address to verify.',
        },
      ],
      sample: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        isValid: true,
        reason: 'Valid email address',
      },
    },
    {
      key: 'verify_bulk',
      noun: 'Bulk Verification',
      display: {
        label: 'Verify Multiple Emails',
        description: 'Verify multiple email addresses at once.',
      },
      operation: {
        perform: {
          url: '{{process.env.NEXT_PUBLIC_APP_URL}}/api/zapier/actions/verify-bulk',
          method: 'POST',
          headers: {
            'X-API-Key': '{{bundle.authData.api_key}}',
            'Content-Type': 'application/json',
          },
          body: {
            emails: '{{bundle.inputData.emails}}',
          },
        },
      },
      inputFields: [
        {
          key: 'emails',
          label: 'Email Addresses',
          type: 'text',
          required: true,
          list: true,
          helpText: 'List of email addresses to verify (comma-separated or line-separated).',
        },
      ],
      sample: {
        jobId: 'job-123',
        status: 'processing',
        totalEmails: 10,
      },
    },
  ],

  // Searches (optional - for finding existing data)
  searches: [
    {
      key: 'find_verification',
      noun: 'Verification',
      display: {
        label: 'Find Verification Result',
        description: 'Find a previous verification result by email.',
      },
      operation: {
        perform: {
          url: '{{process.env.NEXT_PUBLIC_APP_URL}}/api/zapier/searches/find-verification',
          method: 'GET',
          headers: {
            'X-API-Key': '{{bundle.authData.api_key}}',
          },
          params: {
            email: '{{bundle.inputData.email}}',
          },
        },
      },
      inputFields: [
        {
          key: 'email',
          label: 'Email Address',
          type: 'string',
          required: true,
        },
      ],
    },
  ],
}

export default zapierConfig
