# FKbounce API Documentation

Complete API documentation for the FKbounce Email Verification Platform.

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [GraphQL API](#graphql-api)
4. [REST API](#rest-api)
5. [Webhooks](#webhooks)
6. [WebSocket (Real-time)](#websocket-real-time)
7. [Rate Limiting](#rate-limiting)
8. [Error Handling](#error-handling)
9. [SDK Libraries](#sdk-libraries)

---

## Introduction

FKbounce provides a powerful email verification API with both REST and GraphQL endpoints. The API offers:

- **Single & Bulk Verification**: Verify individual emails or process thousands at once
- **Advanced Intelligence**: Reputation scoring, spam trap detection, inbox placement prediction
- **Real-time Updates**: WebSocket support for progress tracking
- **Webhooks**: Receive event notifications at your endpoints
- **GraphQL Support**: Modern API with subscriptions and real-time data

**Base URL**: `https://your-domain.com/api`

---

## Authentication

All API requests require authentication using an API key in the Authorization header.

### Getting Your API Key

1. Sign in to your FKbounce dashboard
2. Navigate to Settings → API Keys
3. Generate a new API key

### Authentication Header

```http
Authorization: Bearer YOUR_API_KEY
```

### Example

```bash
curl -X POST https://your-domain.com/api/verify \
  -H "Authorization: Bearer sk_test_123456" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

---

## GraphQL API

### Endpoint

POST /api/graphql

### GraphQL Playground

Access the interactive GraphQL playground at `/api/graphql` (development mode only).

### Queries

#### 1. Verify Email

Verify a single email address.

```graphql
query {
  verifyEmail(email: "user@example.com") {
    email
    is_valid
    syntax
    dns
    smtp
    disposable
    catch_all
    message
    
    # Intelligence fields
    reputation_score
    is_spam_trap
    is_role_based
    role_type
    email_age
    domain_health_score
    inbox_placement_score
    mx_priority
    insights
  }
}
```

#### 2. Verification History

Get paginated verification history.

```graphql
query {
  verificationHistory(limit: 10, offset: 0) {
    items {
      email
      is_valid
      reputation_score
      created_at
    }
    hasMore
  }
}
```

#### 3. API Usage Stats

Get usage statistics for your account.

```graphql
query {
  apiUsage(
    startDate: "2024-01-01T00:00:00Z"
    endDate: "2024-12-31T23:59:59Z"
  ) {
    total
    today
    thisMonth
    quota
    remaining
    resetDate
    breakdown {
      single
      bulk
      successful
      failed
    }
  }
}
```

#### 4. Rate Limit Status

Check current rate limit status.

```graphql
query {
  rateLimitStatus {
    limit
    remaining
    reset
  }
}
```

#### 5. Smart Lists

Get all your smart lists.

```graphql
query {
  smartLists {
    id
    name
    description
    email_count
    created_at
  }
}
```

#### 6. Verification Job Status

Check status of a bulk verification job.

```graphql
query {
  verificationJob(jobId: "job_123456") {
    jobId
    status
    progress
    processed
    total
    results {
      email
      is_valid
    }
  }
}
```

### Mutations

#### 1. Verify Bulk Emails

Start a bulk verification job.

```graphql
mutation {
  verifyBulkEmails(
    emails: ["user1@example.com", "user2@example.com"]
    webhookUrl: "https://your-app.com/webhook"
  ) {
    jobId
    status
    total
    estimatedTimeSeconds
  }
}
```

#### 2. Create Smart List

Create a new smart list for organizing emails.

```graphql
mutation {
  createSmartList(
    name: "Marketing Leads"
    description: "Q4 campaign leads"
  ) {
    id
    name
    description
    created_at
  }
}
```

#### 3. Add Emails to List

Add emails to an existing smart list.

```graphql
mutation {
  addEmailsToList(
    listId: "list_123"
    emails: ["lead1@example.com", "lead2@example.com"]
  ) {
    success
    added_count
  }
}
```

#### 4. Configure Webhook

Set up webhook for receiving event notifications.

```graphql
mutation {
  configureWebhook(
    url: "https://your-app.com/webhook"
    events: [VERIFICATION_COMPLETED, BATCH_COMPLETED]
    secret: "your_webhook_secret"
  ) {
    id
    url
    events
    active
  }
}
```

#### 5. Delete Webhook

Remove a webhook configuration.

```graphql
mutation {
  deleteWebhook(webhookId: "wh_123") {
    success
  }
}
```

### Subscriptions

#### 1. Verification Progress

Subscribe to real-time progress updates for a bulk job.

```graphql
subscription {
  verificationProgress(jobId: "job_123456") {
    jobId
    status
    progress
    processed
    total
    currentEmail
    estimatedTimeRemaining
  }
}
```

#### 2. Verification Events

Subscribe to all verification events.

```graphql
subscription {
  verificationEvents {
    type
    email
    result {
      is_valid
      reputation_score
    }
    timestamp
  }
}
```

---

## REST API

### 1. Verify Single Email

**Endpoint**: `POST /api/verify`

**Request Body**:

```json
{
  "email": "user@example.com"
}
```

**Response**:

```json
{
  "email": "user@example.com",
  "is_valid": true,
  "syntax": true,
  "dns": true,
  "smtp": true,
  "disposable": false,
  "catch_all": false,
  "message": "Email is valid",
  "reputation_score": 95,
  "is_spam_trap": false,
  "is_role_based": false,
  "inbox_placement_score": 92,
  "domain_health_score": 98,
  "insights": [
    "High reputation sender",
    "Active mailbox"
  ]
}
```

### 2. Verify Bulk Emails

**Endpoint**: `POST /api/verify-bulk`

**Request Body**:

```json
{
  "emails": [
    "user1@example.com",
    "user2@example.com",
    "user3@example.com"
  ],
  "stream": false,
  "webhook_url": "https://your-app.com/webhook"
}
```

**Response**:

```json
{
  "total": 3,
  "unique": 3,
  "duplicates": 0,
  "valid": 2,
  "invalid": 1,
  "results": [
    {
      "email": "user1@example.com",
      "is_valid": true,
      "reputation_score": 95,
      ...
    },
    {
      "email": "user2@example.com",
      "is_valid": true,
      "reputation_score": 88,
      ...
    },
    {
      "email": "user3@example.com",
      "is_valid": false,
      "message": "Domain does not exist",
      ...
    }
  ]
}
```

### 3. Get Verification History

**Endpoint**: `GET /api/verification-history?limit=10&offset=0`

**Response**:

```json
{
  "items": [
    {
      "id": "vh_123",
      "email": "user@example.com",
      "is_valid": true,
      "reputation_score": 95,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "has_more": true
}
```

---

## Webhooks

### Overview

Webhooks allow you to receive real-time notifications about verification events.

### Webhook Events

- `VERIFICATION_COMPLETED` - Single email verification completed
- `VERIFICATION_FAILED` - Single email verification failed
- `BATCH_COMPLETED` - Bulk verification job completed
- `BATCH_PROGRESS` - Progress update for bulk job (every 10%)
- `QUOTA_WARNING` - API quota running low (20% remaining)
- `QUOTA_EXCEEDED` - API quota exceeded

### Webhook Payload

```json
{
  "event": "VERIFICATION_COMPLETED",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "email": "user@example.com",
    "is_valid": true,
    "reputation_score": 95,
    ...
  }
}
```

### Signature Verification

All webhooks include an HMAC-SHA256 signature in the `X-Webhook-Signature` header.

**Header Format**: `sha256=<hex_digest>`

**Verification Example** (Node.js):

```javascript
const crypto = require('crypto')

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = `sha256=${hmac.digest('hex')}`
  return signature === expectedSignature
}
```

### Webhook Retry Logic

- **Retry Attempts**: 3 attempts
- **Retry Schedule**:
  - Attempt 1: Immediate
  - Attempt 2: After 30 seconds
  - Attempt 3: After 5 minutes

### Best Practices

1. **Respond Quickly**: Return 200 OK within 5 seconds
2. **Verify Signatures**: Always verify webhook signatures
3. **Handle Duplicates**: Use idempotency keys
4. **Process Async**: Process webhook data in background jobs

---

## WebSocket (Real-time)

### WebSocket Endpoint

wss://your-domain.com/api/ws/progress?jobId=<JOB_ID>

### Connection

```javascript
const ws = new WebSocket('wss://your-domain.com/api/ws/progress?jobId=job_123456')

ws.onmessage = (event) => {
  const update = JSON.parse(event.data)
  console.log(`Progress: ${update.progress}%`)
  console.log(`Processed: ${update.processed}/${update.total}`)
  console.log(`Time remaining: ${update.estimatedTimeRemaining}s`)
}

ws.onclose = () => {
  console.log('Connection closed')
}
```

### Message Format

```json
{
  "jobId": "job_123456",
  "status": "processing",
  "progress": 45,
  "processed": 450,
  "total": 1000,
  "currentEmail": "user@example.com",
  "estimatedTimeRemaining": 125
}
```

### Status Values

- `processing` - Job is actively running
- `completed` - Job finished successfully
- `failed` - Job encountered an error

---

## Rate Limiting

### Limits by Plan

| Plan | Requests/Minute | Burst |
|------|----------------|-------|
| Free | 120 | 150 |
| Pro  | 600 | 750 |
| Enterprise | Custom | Custom |

### Rate Limit Headers

All responses include rate limit headers:

```http
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1705320000
```

### Handling Rate Limits

When rate limited, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": "Rate limit exceeded",
  "limit": 120,
  "remaining": 0,
  "reset": 1705320000
}
```

**Best Practice**: Implement exponential backoff and respect the `X-RateLimit-Reset` header.

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 403 | Forbidden - Quota exceeded |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "error": "Invalid email format",
  "code": "INVALID_EMAIL",
  "details": {
    "field": "email",
    "reason": "Missing @ symbol"
  }
}
```

### Common Error Codes

- `INVALID_EMAIL` - Email format is invalid
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `QUOTA_EXCEEDED` - Monthly quota used up
- `INVALID_API_KEY` - Authentication failed
- `DOMAIN_NOT_FOUND` - Email domain doesn't exist
- `SMTP_ERROR` - SMTP verification failed

---

## SDK Libraries

### Official SDKs

| Language | Package | Installation |
|----------|---------|--------------|
| Python | `fkbounce-email-verifier` | `pip install fkbounce-email-verifier` |
| Node.js | `@fkbounce/email-verifier` | `npm install @fkbounce/email-verifier` |
| PHP | `fkbounce/email-verifier` | `composer require fkbounce/email-verifier` |
| Ruby | `fkbounce-email-verifier` | `gem install fkbounce-email-verifier` |

### Quick Examples

**Python**:

```python
from fkbounce import EmailVerifier

client = EmailVerifier(api_key='your_api_key')
result = client.verify_email('user@example.com')
```

**Node.js**:

```javascript
import { EmailVerifier } from '@fkbounce/email-verifier'

const client = new EmailVerifier({ apiKey: 'your_api_key' })
const result = await client.verifyEmail('user@example.com')
```

**PHP**:

```php
use FKBounce\EmailVerifier;

$client = new EmailVerifier('your_api_key');
$result = $client->verifyEmail('user@example.com');
```

**Ruby**:

```ruby
require 'fkbounce'

client = FKBounce::EmailVerifier.new(api_key: 'your_api_key')
result = client.verify_email('user@example.com')
```

---

## Support

- **Documentation**: <https://docs.fkbounce.com>
- **Email Support**: <support@fkbounce.com>
- **Status Page**: <https://status.fkbounce.com>
- **GitHub**: <https://github.com/fkbounce>

---

## Changelog

### Version 2.0.0 (Latest)

- ✅ Added GraphQL API with subscriptions
- ✅ Real-time WebSocket progress tracking
- ✅ Enhanced webhook system with retry logic
- ✅ Advanced email intelligence (reputation, spam trap detection)
- ✅ Smart lists for email organization
- ✅ Improved rate limiting
- ✅ SDK support for Python, Node.js, PHP, Ruby

---

## Last Updated: January 2024
