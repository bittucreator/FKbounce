# FKbounce Email Verifier - PHP SDK

Official PHP SDK for FKbounce Email Verification API with GraphQL support.

## Requirements

- PHP 7.4 or higher
- Composer

## Installation

```bash
composer require fkbounce/email-verifier
```

## Quick Start

```php
<?php

require 'vendor/autoload.php';

use FKBounce\EmailVerifier;

// Initialize client
$client = new EmailVerifier('your_api_key_here');

// Verify a single email
$result = $client->verifyEmail('user@example.com');

if ($result['is_valid']) {
    echo "Email is valid!\n";
    echo "Reputation Score: " . $result['reputation_score'] . "\n";
}

// Verify multiple emails
$results = $client->verifyBulk([
    'user1@example.com',
    'user2@example.com',
    'user3@example.com'
]);

echo "Valid: " . $results['valid_count'] . "\n";
echo "Invalid: " . $results['invalid_count'] . "\n";
```

## Features

- ✅ Single & bulk email verification
- ✅ Email intelligence (reputation, spam trap detection)
- ✅ Webhook integration with HMAC signature verification
- ✅ Automatic retry with exponential backoff
- ✅ PSR-4 autoloading
- ✅ Exception handling
- ✅ GraphQL & REST API support

## Usage Examples

### Single Email Verification

```php
<?php

$result = $client->verifyEmail('test@example.com');

// Access verification details
echo "Valid: " . ($result['is_valid'] ? 'Yes' : 'No') . "\n";
echo "Syntax: " . ($result['syntax'] ? 'Valid' : 'Invalid') . "\n";
echo "DNS: " . ($result['dns'] ? 'Found' : 'Not found') . "\n";
echo "SMTP: " . ($result['smtp'] ? 'Active' : 'Inactive') . "\n";

// Intelligence data
echo "Reputation: " . $result['reputation_score'] . "/100\n";
echo "Spam Trap: " . ($result['is_spam_trap'] ? 'Yes' : 'No') . "\n";
echo "Role-based: " . ($result['is_role_based'] ? 'Yes' : 'No') . "\n";
echo "Inbox Placement: " . $result['inbox_placement_score'] . "%\n";
```

### Bulk Verification

```php
<?php

$emails = [
    'user1@example.com',
    'user2@example.com',
    'user3@example.com'
];

// Simple bulk verification
$result = $client->verifyBulk($emails);

echo "Total: " . $result['total'] . "\n";
echo "Valid: " . $result['valid_count'] . "\n";
echo "Invalid: " . $result['invalid_count'] . "\n";

// Access individual results
foreach ($result['results'] as $email_result) {
    echo $email_result['email'] . ": ";
    echo ($email_result['is_valid'] ? 'Valid' : 'Invalid') . "\n";
}

// With webhook
$result = $client->verifyBulk($emails, [
    'webhook_url' => 'https://your-app.com/webhook',
    'webhook_secret' => 'your_secret'
]);
```

### Webhook Integration

```php
<?php

use FKBounce\EmailVerifier;
use FKBounce\Webhook;

// Configure webhook
$webhook = $client->configureWebhook([
    'url' => 'https://your-app.com/webhook',
    'events' => [
        'VERIFICATION_COMPLETED',
        'BATCH_COMPLETED',
        'QUOTA_WARNING'
    ],
    'secret' => 'your_webhook_secret'
]);

echo "Webhook ID: " . $webhook['id'] . "\n";

// In your webhook endpoint
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';

if (Webhook::verifySignature($payload, $signature, 'your_webhook_secret')) {
    $data = json_decode($payload, true);
    $event = $data['event'];
    $eventData = $data['data'];
    
    switch ($event) {
        case 'VERIFICATION_COMPLETED':
            echo "Email verified: " . $eventData['email'] . "\n";
            break;
        case 'BATCH_COMPLETED':
            echo "Batch completed: " . $eventData['jobId'] . "\n";
            break;
        case 'QUOTA_WARNING':
            echo "Quota warning: " . $eventData['remaining'] . " left\n";
            break;
    }
    
    http_response_code(200);
} else {
    http_response_code(401);
    echo "Invalid signature";
}
```

### API Usage Analytics

```php
<?php

// Get usage statistics
$usage = $client->getUsage();

echo "Total verifications: " . $usage['total'] . "\n";
echo "Today: " . $usage['today'] . "\n";
echo "This month: " . $usage['this_month'] . "\n";
echo "Quota: " . $usage['quota'] . "\n";
echo "Remaining: " . $usage['remaining'] . "\n";

// Breakdown
$breakdown = $usage['breakdown'];
echo "Single: " . $breakdown['single'] . "\n";
echo "Bulk: " . $breakdown['bulk'] . "\n";
$successRate = ($breakdown['successful'] / $usage['total']) * 100;
echo "Success rate: " . number_format($successRate, 1) . "%\n";

// Rate limit status
$rateLimit = $client->getRateLimitStatus();
echo "Rate limit: " . $rateLimit['remaining'] . "/" . $rateLimit['limit'] . "\n";
```

### Smart Lists

```php
<?php

// Create a smart list
$list = $client->createSmartList([
    'name' => 'Marketing Leads',
    'description' => 'Email list for Q4 campaign'
]);

echo "Created list: " . $list['id'] . "\n";

// Add emails to list
$client->addEmailsToList([
    'list_id' => $list['id'],
    'emails' => ['lead1@example.com', 'lead2@example.com']
]);

// Get all lists
$lists = $client->getSmartLists();
foreach ($lists as $list) {
    echo $list['name'] . ": " . $list['email_count'] . " emails\n";
}
```

### Error Handling

```php
<?php

use FKBounce\EmailVerifier;
use FKBounce\Exceptions\RateLimitException;
use FKBounce\Exceptions\QuotaExceededException;
use FKBounce\Exceptions\FKBounceException;

try {
    $result = $client->verifyEmail('test@example.com');
} catch (RateLimitException $e) {
    echo "Rate limit exceeded. Retry after " . $e->getRetryAfter() . " seconds\n";
} catch (QuotaExceededException $e) {
    echo "Quota exceeded: " . $e->getMessage() . "\n";
} catch (FKBounceException $e) {
    echo "API error: " . $e->getMessage() . "\n";
}
```

## Configuration

```php
<?php

use FKBounce\EmailVerifier;

$client = new EmailVerifier('your_api_key', [
    'base_url' => 'https://api.fkbounce.com',  // Optional: custom endpoint
    'timeout' => 30,  // Request timeout in seconds
    'max_retries' => 3,  // Number of retry attempts
    'retry_backoff' => 2  // Exponential backoff multiplier
]);
```

## GraphQL Direct Access

```php
<?php

// Execute custom GraphQL queries
$query = <<<'GRAPHQL'
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
GRAPHQL;

$result = $client->executeGraphQL($query);
print_r($result['data']);

// With variables
$mutation = <<<'GRAPHQL'
    mutation CreateList($name: String!, $description: String) {
        createSmartList(name: $name, description: $description) {
            id
            name
            created_at
        }
    }
GRAPHQL;

$result = $client->executeGraphQL($mutation, [
    'name' => 'New List',
    'description' => 'My email list'
]);
```

## Laravel Integration

```php
<?php

// config/services.php
return [
    'fkbounce' => [
        'api_key' => env('FKBOUNCE_API_KEY'),
    ],
];

// app/Services/EmailVerificationService.php
namespace App\Services;

use FKBounce\EmailVerifier;

class EmailVerificationService
{
    private $client;
    
    public function __construct()
    {
        $this->client = new EmailVerifier(config('services.fkbounce.api_key'));
    }
    
    public function verify(string $email)
    {
        return $this->client->verifyEmail($email);
    }
}

// Usage in controller
public function verifyEmail(Request $request)
{
    $verifier = new EmailVerificationService();
    $result = $verifier->verify($request->input('email'));
    
    return response()->json($result);
}
```

## WordPress Integration

```php
<?php

// In your theme's functions.php or plugin
add_action('init', function() {
    require_once get_template_directory() . '/vendor/autoload.php';
});

function verify_user_email($email) {
    $client = new FKBounce\EmailVerifier(get_option('fkbounce_api_key'));
    return $client->verifyEmail($email);
}

// Use in registration hook
add_filter('pre_user_email', function($email) {
    $result = verify_user_email($email);
    
    if (!$result['is_valid']) {
        return new WP_Error('invalid_email', 'Please provide a valid email address.');
    }
    
    return $email;
});
```

## Development

```bash
# Install dependencies
composer install

# Run tests
composer test

# Code style check
composer phpcs
```

## API Reference

Full documentation: <https://docs.fkbounce.com>

## Support

- Email: <support@fkbounce.com>
- GitHub: <https://github.com/fkbounce/php-sdk/issues>
- Documentation: <https://docs.fkbounce.com/sdks/php>

## License

MIT License
