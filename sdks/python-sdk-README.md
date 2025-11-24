# FKbounce Email Verifier - Python SDK

Official Python SDK for FKbounce Email Verification API with GraphQL support.

## Installation

```bash
pip install fkbounce-email-verifier
```

## Quick Start

```python
from fkbounce import EmailVerifier

# Initialize client with API key
client = EmailVerifier(api_key='your_api_key_here')

# Verify a single email
result = client.verify_email('user@example.com')
print(f"Valid: {result['is_valid']}")
print(f"Reputation Score: {result['reputation_score']}")

# Verify multiple emails
results = client.verify_bulk([
    'user1@example.com',
    'user2@example.com',
    'user3@example.com'
])

for email_result in results['results']:
    print(f"{email_result['email']}: {email_result['is_valid']}")
```

## Features

- ✅ Single email verification
- ✅ Bulk verification with progress tracking
- ✅ Real-time WebSocket progress updates
- ✅ Email intelligence (reputation, spam trap detection)
- ✅ Webhook integration
- ✅ Automatic retry with exponential backoff
- ✅ Type hints for better IDE support

## Usage Examples

### Single Email Verification

```python
result = client.verify_email('test@example.com')

# Access verification details
if result['is_valid']:
    print(f"Syntax: {result['syntax']}")
    print(f"DNS: {result['dns']}")
    print(f"SMTP: {result['smtp']}")
    print(f"Disposable: {result['disposable']}")
    
    # Intelligence data
    print(f"Reputation: {result['reputation_score']}/100")
    print(f"Spam Trap: {result['is_spam_trap']}")
    print(f"Role-based: {result['is_role_based']}")
    print(f"Inbox Placement: {result['inbox_placement_score']}%")
```

### Bulk Verification with Progress

```python
# Verify multiple emails
emails = ['user1@example.com', 'user2@example.com', 'user3@example.com']

# Option 1: Simple bulk verification
results = client.verify_bulk(emails)
print(f"Valid: {results['valid_count']}")
print(f"Invalid: {results['invalid_count']}")

# Option 2: With progress callback
def on_progress(progress):
    print(f"Progress: {progress['percent']}% - {progress['processed']}/{progress['total']}")

results = client.verify_bulk(emails, on_progress=on_progress)

# Option 3: With webhook
results = client.verify_bulk(
    emails,
    webhook_url='https://your-app.com/webhook',
    webhook_secret='your_webhook_secret'
)
```

### Real-time Progress Tracking

```python
import asyncio
from fkbounce import EmailVerifier

client = EmailVerifier(api_key='your_api_key')

async def verify_with_live_updates():
    # Start bulk verification
    job = await client.verify_bulk_async(['email1@test.com', 'email2@test.com'])
    
    # Subscribe to real-time progress
    async for update in client.subscribe_to_job(job['job_id']):
        print(f"Status: {update['status']}")
        print(f"Progress: {update['progress']}%")
        print(f"Processed: {update['processed']}/{update['total']}")
        
        if update['status'] in ['completed', 'failed']:
            break

# Run async function
asyncio.run(verify_with_live_updates())
```

### Webhook Integration

```python
# Configure webhook
webhook = client.configure_webhook(
    url='https://your-app.com/webhook',
    events=[
        'VERIFICATION_COMPLETED',
        'BATCH_COMPLETED',
        'QUOTA_WARNING'
    ],
    secret='your_secret_key'
)

print(f"Webhook ID: {webhook['id']}")

# Verify webhook signature (in your webhook endpoint)
from fkbounce.webhooks import verify_signature

@app.route('/webhook', methods=['POST'])
def handle_webhook():
    payload = request.get_data(as_text=True)
    signature = request.headers.get('X-Webhook-Signature')
    
    if verify_signature(payload, signature, 'your_secret_key'):
        data = request.json
        print(f"Event: {data['event']}")
        print(f"Data: {data['data']}")
        return 'OK', 200
    else:
        return 'Invalid signature', 401
```

### API Usage Analytics

```python
# Get usage statistics
usage = client.get_usage()

print(f"Total verifications: {usage['total']}")
print(f"Today: {usage['today']}")
print(f"This month: {usage['this_month']}")
print(f"Quota: {usage['quota']}")
print(f"Remaining: {usage['remaining']}")

# Breakdown
print(f"Single: {usage['breakdown']['single']}")
print(f"Bulk: {usage['breakdown']['bulk']}")
print(f"Success rate: {usage['breakdown']['successful'] / usage['total'] * 100:.1f}%")

# Rate limit status
rate_limit = client.get_rate_limit_status()
print(f"Rate limit: {rate_limit['remaining']}/{rate_limit['limit']}")
```

### Smart Lists

```python
# Create a smart list
list_obj = client.create_smart_list(
    name='Marketing Leads',
    description='Email list for marketing campaigns'
)

# Add emails to list
client.add_emails_to_list(
    list_id=list_obj['id'],
    emails=['lead1@example.com', 'lead2@example.com']
)

# Get all lists
lists = client.get_smart_lists()
for lst in lists:
    print(f"{lst['name']}: {lst['email_count']} emails")
```

## Error Handling

```python
from fkbounce import EmailVerifier, FKBounceError, RateLimitError, QuotaExceededError

client = EmailVerifier(api_key='your_api_key')

try:
    result = client.verify_email('test@example.com')
except RateLimitError as e:
    print(f"Rate limit exceeded. Retry after {e.retry_after} seconds")
except QuotaExceededError as e:
    print(f"Quota exceeded. {e.message}")
except FKBounceError as e:
    print(f"API error: {e}")
```

## Configuration

```python
# Custom configuration
client = EmailVerifier(
    api_key='your_api_key',
    base_url='https://api.fkbounce.com',  # Custom API endpoint
    timeout=30,  # Request timeout in seconds
    max_retries=3,  # Number of retry attempts
    retry_backoff=2  # Exponential backoff multiplier
)
```

## GraphQL Direct Access

```python
# Execute custom GraphQL queries
query = '''
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
'''

result = client.execute_graphql(query)
print(result['data'])
```

## Development

```bash
# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Type checking
mypy fkbounce
```

## API Reference

Full API documentation: <https://docs.fkbounce.com>

## Support

- Email: <support@fkbounce.com>
- GitHub Issues: <https://github.com/fkbounce/python-sdk/issues>
- Documentation: <https://docs.fkbounce.com/sdks/python>

## License

MIT License - see LICENSE file for details
