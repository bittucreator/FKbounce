# FKbounce - Email Verification Platform

A comprehensive, production-ready email verification platform built with **Next.js 14**, **TypeScript**, **GraphQL**, and **Tailwind CSS**. Features advanced intelligence, real-time progress tracking, webhook integrations, and multi-language SDKs.

## ✨ Features

### Core Verification

- **Syntax Validation**: RFC 5322 compliant email format checking
- **DNS/MX Record Check**: Verifies domain mail exchange records
- **SMTP Verification**: Tests mailbox existence with retry logic
- **Disposable Email Detection**: Identifies temporary/throwaway addresses
- **Catch-All Detection**: Identifies domains that accept all emails

### Advanced Intelligence

- **Reputation Scoring**: 0-100 score based on multiple factors
- **Spam Trap Detection**: Identifies potential spam trap addresses
- **Inbox Placement Prediction**: Estimates likelihood of inbox delivery
- **Role-Based Detection**: Identifies sales@, support@, info@ type addresses
- **Email Age Estimation**: Pattern-based age detection
- **Domain Health Analysis**: MX record priority and redundancy scoring

### Bulk Processing

- **High Volume**: Process thousands of emails efficiently
- **Real-time Progress**: WebSocket-based live updates
- **Smart Deduplication**: Automatic duplicate detection
- **Export Options**: CSV and Excel export with intelligence data
- **Streaming Support**: Memory-efficient processing for large batches

### Developer Features

- **GraphQL API**: Modern API with queries, mutations, and subscriptions
- **REST API**: Traditional REST endpoints for compatibility
- **Webhooks**: Real-time event notifications with HMAC signatures
- **Rate Limiting**: Per-plan rate limits with burst support
- **API Usage Analytics**: Comprehensive usage tracking and reporting
- **Multi-language SDKs**: Python, Node.js, PHP, Ruby with full examples

### User Experience

- **Smart Lists**: Organize and manage verified emails
- **Verification History**: Complete audit trail of all verifications
- **Analytics Dashboard**: Visual insights with charts and metrics
- **Dark Mode**: Full dark mode support
- **Responsive Design**: Works perfectly on all devices

## 🛠️ Tech Stack

- **Framework**: Next.js 14 App Router with Server Actions
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS + shadcn/ui components
- **API**: GraphQL (graphql-yoga) + REST
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: WebSocket + GraphQL Subscriptions
- **Charts**: Recharts for analytics visualizations
- **Payments**: Dodo Payments integration
- **Export**: XLSX for Excel, CSV generation

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/email-verifier.git
cd email-verifier

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run database migrations (if needed)
# Run development server
npm run dev
```

## 🚀 Quick Start

### Using the Web Interface

1. Navigate to `http://localhost:3000`
2. Sign in or create an account
3. Choose Single or Bulk verification
4. View results with intelligence metrics
5. Export data or save to Smart Lists

### Using the API

#### REST API

```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

#### GraphQL API

```bash
curl -X POST http://localhost:3000/api/graphql \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ verifyEmail(email: \"user@example.com\") { is_valid reputation_score } }"}'
```

## 📡 API Endpoints

### REST API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/verify` | POST | Verify single email |
| `/api/verify-bulk` | POST | Verify multiple emails |
| `/api/verification-history` | GET | Get verification history |
| `/api/analytics` | GET | Get usage analytics |
| `/api/health` | GET | Health check |

### GraphQL API Reference

**Endpoint**: `/api/graphql`

**Queries**:

- `verifyEmail` - Verify single email
- `verificationHistory` - Get history with pagination
- `apiUsage` - Get usage statistics
- `rateLimitStatus` - Check rate limits
- `smartLists` - Get all smart lists
- `verificationJob` - Check job status

**Mutations**:

- `verifyBulkEmails` - Start bulk verification job
- `createSmartList` - Create new list
- `addEmailsToList` - Add emails to list
- `configureWebhook` - Set up webhook
- `deleteWebhook` - Remove webhook

**Subscriptions**:

- `verificationProgress` - Real-time job progress
- `verificationEvents` - Live event stream

### WebSocket

**Endpoint**: `ws://localhost:3000/api/ws/progress?jobId=<JOB_ID>`

Real-time progress updates for bulk verification jobs.

## 🔧 Configuration

}

### POST /api/verify-bulk

Verify multiple email addresses

**Request Body:**

```json
{
  "emails": ["user1@example.com", "user2@example.com"]
}
```

**Response:**

```json
{
  "total": 2,
  "valid": 1,
  "invalid": 1,
  "results": [...]
}
```

## Project Structure

/
├── app/
│   ├── api/
│   │   ├── health/
│   │   │   └── route.ts
│   │   ├── verify/
│   │   │   └── route.ts
│   │   └── verify-bulk/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── BulkVerifier.tsx
│   └── EmailVerifier.tsx
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json

````markdown
```

## License

MIT
