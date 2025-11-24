# FKbounce Email Verifier - Node.js SDK

Official TypeScript/JavaScript SDK for FKbounce Email Verification API with GraphQL support.

## Installation

```bash
npm install @fkbounce/email-verifier
# or
yarn add @fkbounce/email-verifier
```

## Quick Start

```typescript
import { EmailVerifier } from '@fkbounce/email-verifier'

// Initialize client
const client = new EmailVerifier({ apiKey: 'your_api_key_here' })

// Verify a single email
const result = await client.verifyEmail('user@example.com')
console.log(`Valid: ${result.is_valid}`)
console.log(`Reputation: ${result.reputation_score}`)

// Verify multiple emails
const bulkResult = await client.verifyBulk([
  'user1@example.com',
  'user2@example.com',
  'user3@example.com'
])

console.log(`Valid: ${bulkResult.valid_count}`)
console.log(`Invalid: ${bulkResult.invalid_count}`)
```

## Features

- ✅ Full TypeScript support with type definitions
- ✅ Single & bulk email verification
- ✅ Real-time progress tracking via WebSocket
- ✅ Email intelligence metrics
- ✅ Webhook integration with signature verification
- ✅ Automatic retry with exponential backoff
- ✅ Promise-based async/await API
- ✅ GraphQL & REST support

## Usage Examples

### Single Email Verification

```typescript
interface VerificationResult {
  email: string
  is_valid: boolean
  syntax: boolean
  dns: boolean
  smtp: boolean
  disposable: boolean
  catch_all: boolean
  reputation_score: number
  is_spam_trap: boolean
  is_role_based: boolean
  inbox_placement_score: number
  insights: string[]
}

const result: VerificationResult = await client.verifyEmail('test@example.com')

if (result.is_valid) {
  console.log(`Reputation: ${result.reputation_score}/100`)
  console.log(`Inbox Placement: ${result.inbox_placement_score}%`)
  console.log(`Spam Trap: ${result.is_spam_trap}`)
}
```

### Bulk Verification

```typescript
const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com']

// Simple bulk verification
const result = await client.verifyBulk(emails)
console.log(`Total: ${result.total}`)
console.log(`Valid: ${result.valid_count}`)
console.log(`Invalid: ${result.invalid_count}`)

// With progress callback
const result = await client.verifyBulk(emails, {
  onProgress: (progress) => {
    console.log(`${progress.percent}% complete`)
    console.log(`${progress.processed}/${progress.total} processed`)
  }
})

// With webhook
const result = await client.verifyBulk(emails, {
  webhookUrl: 'https://your-app.com/webhook',
  webhookSecret: 'your_secret'
})
```

### Real-time Progress with WebSocket

```typescript
// Start bulk verification and get job ID
const job = await client.verifyBulkAsync(emails)

// Subscribe to real-time progress updates
client.subscribeToProgress(job.job_id, (update) => {
  console.log(`Status: ${update.status}`)
  console.log(`Progress: ${update.progress}%`)
  console.log(`Time remaining: ${update.estimated_time_remaining}s`)
  
  if (update.status === 'completed') {
    console.log('Verification complete!')
    client.unsubscribe(job.job_id)
  }
})
```

### Webhook Integration

```typescript
// Configure webhook
const webhook = await client.configureWebhook({
  url: 'https://your-app.com/webhook',
  events: [
    'VERIFICATION_COMPLETED',
    'BATCH_COMPLETED',
    'QUOTA_WARNING'
  ],
  secret: 'your_webhook_secret'
})

console.log(`Webhook ID: ${webhook.id}`)

// In your Express.js webhook endpoint
import { verifyWebhookSignature } from '@fkbounce/email-verifier'

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'] as string
  const payload = JSON.stringify(req.body)
  
  if (verifyWebhookSignature(payload, signature, 'your_webhook_secret')) {
    const { event, data } = req.body
    console.log(`Webhook event: ${event}`)
    console.log(`Data:`, data)
    res.sendStatus(200)
  } else {
    res.sendStatus(401)
  }
})
```

### API Usage Analytics

```typescript
// Get usage statistics
const usage = await client.getUsage()

console.log(`Total: ${usage.total}`)
console.log(`Today: ${usage.today}`)
console.log(`This month: ${usage.this_month}`)
console.log(`Remaining: ${usage.remaining}/${usage.quota}`)

// Get rate limit status
const rateLimit = await client.getRateLimitStatus()
console.log(`Rate limit: ${rateLimit.remaining}/${rateLimit.limit}`)
console.log(`Resets at: ${new Date(rateLimit.reset)}`)
```

### Smart Lists

```typescript
// Create a smart list
const list = await client.createSmartList({
  name: 'Marketing Leads',
  description: 'Q4 campaign leads'
})

// Add emails to list
await client.addEmailsToList({
  listId: list.id,
  emails: ['lead1@example.com', 'lead2@example.com']
})

// Get all lists
const lists = await client.getSmartLists()
lists.forEach(list => {
  console.log(`${list.name}: ${list.email_count} emails`)
})
```

### Error Handling

```typescript
import { 
  EmailVerifier, 
  FKBounceError, 
  RateLimitError, 
  QuotaExceededError 
} from '@fkbounce/email-verifier'

try {
  const result = await client.verifyEmail('test@example.com')
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`)
  } else if (error instanceof QuotaExceededError) {
    console.log(`Quota exceeded: ${error.message}`)
  } else if (error instanceof FKBounceError) {
    console.log(`API error: ${error.message}`)
  }
}
```

## Configuration

```typescript
const client = new EmailVerifier({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.fkbounce.com',  // Optional: custom endpoint
  timeout: 30000,  // Request timeout in ms
  maxRetries: 3,  // Number of retry attempts
  retryBackoff: 2  // Exponential backoff multiplier
})
```

## GraphQL Direct Access

```typescript
// Execute custom GraphQL queries
const query = `
  query {
    verificationHistory(limit: 10) {
      items {
        email
        is_valid
        reputation_score
        created_at
      }
    }
  }
`

const result = await client.executeGraphQL(query)
console.log(result.data)

// With variables
const mutation = `
  mutation CreateList($name: String!, $description: String) {
    createSmartList(name: $name, description: $description) {
      id
      name
      created_at
    }
  }
`

const result = await client.executeGraphQL(mutation, {
  name: 'New List',
  description: 'My email list'
})
```

## React Integration

```typescript
import { EmailVerifier } from '@fkbounce/email-verifier'
import { useState, useEffect } from 'react'

function EmailVerificationComponent() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const client = new EmailVerifier({ apiKey: process.env.FKBOUNCE_API_KEY })
  
  const verifyEmail = async (email: string) => {
    setLoading(true)
    try {
      const result = await client.verifyEmail(email)
      setResult(result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      <input 
        type="email" 
        onChange={(e) => verifyEmail(e.target.value)} 
      />
      {loading && <p>Verifying...</p>}
      {result && (
        <div>
          <p>Valid: {result.is_valid ? 'Yes' : 'No'}</p>
          <p>Reputation: {result.reputation_score}/100</p>
        </div>
      )}
    </div>
  )
}
```

## Next.js API Route Example

```typescript
// pages/api/verify.ts
import { EmailVerifier } from '@fkbounce/email-verifier'
import type { NextApiRequest, NextApiResponse } from 'next'

const client = new EmailVerifier({ 
  apiKey: process.env.FKBOUNCE_API_KEY! 
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const { email } = req.body
  
  try {
    const result = await client.verifyEmail(email)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' })
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Type checking
npm run typecheck
```

## API Reference

Full documentation at: <https://docs.fkbounce.com>

## Support

- Email: <support@fkbounce.com>
- GitHub: <https://github.com/fkbounce/nodejs-sdk/issues>
- Documentation: <https://docs.fkbounce.com/sdks/nodejs>

## License

MIT License
