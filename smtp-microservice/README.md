# SMTP Verification Microservice

Express.js microservice for SMTP email verification with catch-all detection.

## Features

- ✅ SMTP verification (checks if email exists)
- ✅ Catch-all detection (tests if domain accepts all emails)
- ✅ Port 25 connectivity testing
- ✅ API key authentication
- ✅ Rate limiting
- ✅ CORS enabled
- ✅ Helmet security

## Environment Variables

Create a `.env` file or set in Azure App Service:

```env
PORT=8080
API_KEY=your-secure-api-key-here
ALLOWED_ORIGINS=https://fkbounce.com,https://app.fkbounce.com,https://www.fkbounce.com
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Test Port 25
```
GET /test-port25
```

### Check SMTP
```
POST /check-smtp
Headers: x-api-key: your-api-key
Body: {
  "email": "test@example.com",
  "mxRecords": ["mx1.example.com"]
}
```

### Check Catch-All
```
POST /check-catchall
Headers: x-api-key: your-api-key
Body: {
  "domain": "example.com",
  "mxRecords": ["mx1.example.com"]
}
```

### Combined Verification
```
POST /verify
Headers: x-api-key: your-api-key
Body: {
  "email": "test@example.com",
  "domain": "example.com",
  "mxRecords": ["mx1.example.com"]
}
```

## Deploy to Azure App Service

1. Create Azure App Service (Node.js 18+)
2. Set environment variables in Configuration
3. Deploy via GitHub Actions or Azure CLI
4. Test with `/test-port25` endpoint

## Security

- API Key required for all verification endpoints
- Rate limiting: 100 requests/minute
- CORS configured for specific origins
- Helmet security headers enabled
