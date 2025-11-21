# FKbounce

A comprehensive email verification tool built with **Next.js 14**, **TypeScript**, and **Tailwind CSS** that validates email addresses through multiple checks:

- **Syntax Validation**: Checks if email format is valid
- **DNS/MX Record Check**: Verifies if the domain has mail exchange records
- **SMTP Verification**: Tests if the mailbox exists (when possible)
- **Disposable Email Detection**: Identifies temporary/disposable email addresses
- **Bulk Verification**: Verify multiple emails at once with CSV export

## Features

- ⚡ Built with Next.js 14 App Router
- 🔷 Full TypeScript support
- 🎨 Styled with Tailwind CSS
- 🚀 Server-side API routes
- 📊 Bulk email validation
- 📥 CSV export functionality
- 🎯 Real-time email verification
- 💅 Modern, responsive UI

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Email Validation**: DNS lookup, SMTP verification
- **Runtime**: Node.js

## Installation

Install dependencies:

```bash
npm install
```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The API endpoints are available at:
- `POST /api/verify` - Single email verification
- `POST /api/verify-bulk` - Bulk email verification (max 100)
- `GET /api/health` - Health check

## Production Build

```bash
npm run build
npm start
```

## API Endpoints

### POST /api/verify
Verify a single email address

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "email": "user@example.com",
  "valid": true,
  "syntax": true,
  "dns": true,
  "smtp": true,
  "disposable": false,
  "message": "Email is valid"
}
```

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

```
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
```

## License

MIT
