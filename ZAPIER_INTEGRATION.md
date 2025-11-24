# FKbounce Zapier Integration

Connect FKbounce with 7000+ apps through Zapier to automate your email verification workflows.

## Features

### Triggers (When this happens...)
1. **Email Verified** - Triggers when an email is verified (single or bulk)
2. **Bulk Job Completed** - Triggers when a bulk verification job finishes

### Actions (Do this...)
1. **Verify Single Email** - Verify a single email address
2. **Verify Multiple Emails** - Verify multiple emails at once
3. **Find Verification** - Search for a previous verification result

## Authentication

FKbounce uses API Key authentication with Zapier.

1. Go to [FKbounce API Keys](https://fkbounce.com/api-keys)
2. Create a new API key
3. Copy the API key
4. When connecting in Zapier, paste your API key

## Popular Workflows (Zaps)

### 1. Verify Emails from Google Sheets
**Trigger:** Google Sheets - New Row  
**Action:** FKbounce - Verify Single Email  
**Action:** Google Sheets - Update Row (with verification status)

### 2. Clean Mailchimp List
**Trigger:** Mailchimp - New Subscriber  
**Action:** FKbounce - Verify Single Email  
**Action:** Mailchimp - Unsubscribe (if invalid)

### 3. Validate HubSpot Contacts
**Trigger:** HubSpot - New Contact  
**Action:** FKbounce - Verify Single Email  
**Action:** HubSpot - Update Contact (add verification status)

### 4. Salesforce Lead Verification
**Trigger:** Salesforce - New Lead  
**Action:** FKbounce - Verify Single Email  
**Action:** Salesforce - Update Lead (mark valid/invalid)

### 5. Slack Notifications for Bulk Jobs
**Trigger:** FKbounce - Bulk Job Completed  
**Action:** Slack - Send Channel Message (with job summary)

### 6. Airtable Email Validation
**Trigger:** Airtable - New Record  
**Action:** FKbounce - Verify Single Email  
**Action:** Airtable - Update Record

### 7. Gmail + Google Sheets Integration
**Trigger:** Gmail - New Email  
**Action:** FKbounce - Verify Single Email (sender's email)  
**Action:** Google Sheets - Add Row (log verification)

### 8. Typeform Lead Qualification
**Trigger:** Typeform - New Entry  
**Action:** FKbounce - Verify Single Email  
**Filter:** Only continue if email is valid  
**Action:** Add to CRM

## API Endpoints

All Zapier endpoints are located at `https://fkbounce.com/api/zapier/*`

### Authentication Test
```
GET /api/zapier/test
Headers: X-API-Key: your_api_key
```

### Triggers

#### Email Verified
```
GET /api/zapier/triggers/email-verified?limit=50&since=2024-01-01
Headers: X-API-Key: your_api_key
```

#### Bulk Job Completed
```
GET /api/zapier/triggers/bulk-completed?limit=50
Headers: X-API-Key: your_api_key
```

### Actions

#### Verify Single Email
```
POST /api/zapier/actions/verify-email
Headers: X-API-Key: your_api_key
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Verify Multiple Emails
```
POST /api/zapier/actions/verify-bulk
Headers: X-API-Key: your_api_key
Content-Type: application/json

{
  "emails": ["email1@example.com", "email2@example.com"]
}
```

Or comma-separated:
```json
{
  "emails": "email1@example.com,email2@example.com,email3@example.com"
}
```

### Searches

#### Find Verification
```
GET /api/zapier/searches/find-verification?email=user@example.com
Headers: X-API-Key: your_api_key
```

## Sample Responses

### Email Verified Trigger
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "isValid": true,
  "reason": "Valid email address",
  "syntax": { "isValid": true },
  "dns": { "isValid": true, "hasMxRecords": true },
  "smtp": { "isValid": true },
  "isDisposable": false,
  "isFreeProvider": true,
  "verifiedAt": "2024-11-24T10:00:00Z"
}
```

### Bulk Job Completed Trigger
```json
{
  "id": "job-123",
  "status": "completed",
  "totalEmails": 100,
  "validEmails": 85,
  "invalidEmails": 15,
  "startedAt": "2024-11-24T10:00:00Z",
  "completedAt": "2024-11-24T10:30:00Z"
}
```

## Rate Limits

- **Free Plan:** 120 requests/minute
- **Pro Plan:** 600 requests/minute

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 599
X-RateLimit-Reset: 1732456789
```

## Error Handling

Zapier will automatically retry failed actions. Common error codes:

- `401` - Invalid or missing API key
- `429` - Rate limit exceeded
- `400` - Invalid request (missing email, etc.)
- `500` - Server error

## Testing Your Integration

1. Create a test Zap with a manual trigger
2. Add FKbounce action "Verify Single Email"
3. Test with email: `test@example.com`
4. Check the output for verification results
5. Publish your Zap when ready

## Advanced Usage

### Multi-Step Zaps

**Lead Qualification Workflow:**
1. Trigger: New form submission
2. Action: FKbounce - Verify Email
3. Filter: Only continue if `isValid = true`
4. Action: Add to CRM
5. Action: Send welcome email
6. Filter: Only continue if `isDisposable = false`
7. Action: Add to premium nurture sequence

### Paths

Use Zapier Paths to handle different verification results:

**Path A (Valid Email):**
- Condition: isValid = true AND isDisposable = false
- Actions: Add to main list, send onboarding

**Path B (Invalid/Disposable):**
- Condition: isValid = false OR isDisposable = true
- Actions: Add to cleanup list, notify admin

## Support

- **Documentation:** https://fkbounce.com/docs
- **API Reference:** https://fkbounce.com/api-keys (Documentation tab)
- **Email:** support@fkbounce.com

## Changelog

### v1.0.0 (Nov 2024)
- Initial Zapier integration
- Email Verified trigger
- Bulk Job Completed trigger
- Verify Single Email action
- Verify Multiple Emails action
- Find Verification search
