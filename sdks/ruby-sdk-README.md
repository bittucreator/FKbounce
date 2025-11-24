# FKbounce Email Verifier - Ruby SDK

Official Ruby SDK for FKbounce Email Verification API with GraphQL support.

## Requirements

- Ruby 2.7 or higher

## Installation

Add to your Gemfile:

```ruby
gem 'fkbounce-email-verifier'
```

Or install directly:

```bash
gem install fkbounce-email-verifier
```

## Quick Start

```ruby
require 'fkbounce'

# Initialize client
client = FKBounce::EmailVerifier.new(api_key: 'your_api_key_here')

# Verify a single email
result = client.verify_email('user@example.com')
puts "Valid: #{result[:is_valid]}"
puts "Reputation: #{result[:reputation_score]}"

# Verify multiple emails
results = client.verify_bulk([
  'user1@example.com',
  'user2@example.com',
  'user3@example.com'
])

puts "Valid: #{results[:valid_count]}"
puts "Invalid: #{results[:invalid_count]}"
```

## Features

- ✅ Single & bulk email verification
- ✅ Real-time progress tracking
- ✅ Email intelligence metrics
- ✅ Webhook integration with signature verification
- ✅ Automatic retry with exponential backoff
- ✅ Thread-safe
- ✅ RSpec test helpers
- ✅ GraphQL & REST API support

## Usage Examples

### Single Email Verification

```ruby
result = client.verify_email('test@example.com')

if result[:is_valid]
  puts "Syntax: #{result[:syntax]}"
  puts "DNS: #{result[:dns]}"
  puts "SMTP: #{result[:smtp]}"
  puts "Disposable: #{result[:disposable]}"
  
  # Intelligence data
  puts "Reputation: #{result[:reputation_score]}/100"
  puts "Spam Trap: #{result[:is_spam_trap]}"
  puts "Role-based: #{result[:is_role_based]}"
  puts "Inbox Placement: #{result[:inbox_placement_score]}%"
end
```

### Bulk Verification

```ruby
emails = ['user1@example.com', 'user2@example.com', 'user3@example.com']

# Simple bulk verification
result = client.verify_bulk(emails)
puts "Total: #{result[:total]}"
puts "Valid: #{result[:valid_count]}"
puts "Invalid: #{result[:invalid_count]}"

# Access individual results
result[:results].each do |email_result|
  puts "#{email_result[:email]}: #{email_result[:is_valid] ? 'Valid' : 'Invalid'}"
end

# With progress block
result = client.verify_bulk(emails) do |progress|
  puts "#{progress[:percent]}% complete"
  puts "#{progress[:processed]}/#{progress[:total]} processed"
end

# With webhook
result = client.verify_bulk(
  emails,
  webhook_url: 'https://your-app.com/webhook',
  webhook_secret: 'your_secret'
)
```

### Real-time Progress Tracking

```ruby
# Start bulk verification
job = client.verify_bulk_async(emails)

# Subscribe to progress updates
client.subscribe_to_progress(job[:job_id]) do |update|
  puts "Status: #{update[:status]}"
  puts "Progress: #{update[:progress]}%"
  puts "Time remaining: #{update[:estimated_time_remaining]}s"
  
  if %w[completed failed].include?(update[:status])
    puts 'Verification complete!'
    break
  end
end
```

### Webhook Integration

```ruby
# Configure webhook
webhook = client.configure_webhook(
  url: 'https://your-app.com/webhook',
  events: %w[
    VERIFICATION_COMPLETED
    BATCH_COMPLETED
    QUOTA_WARNING
  ],
  secret: 'your_webhook_secret'
)

puts "Webhook ID: #{webhook[:id]}"

# In your Sinatra/Rails webhook endpoint
require 'fkbounce/webhook'

post '/webhook' do
  payload = request.body.read
  signature = request.env['HTTP_X_WEBHOOK_SIGNATURE']
  
  if FKBounce::Webhook.verify_signature(payload, signature, 'your_webhook_secret')
    data = JSON.parse(payload, symbolize_names: true)
    event = data[:event]
    event_data = data[:data]
    
    case event
    when 'VERIFICATION_COMPLETED'
      puts "Email verified: #{event_data[:email]}"
    when 'BATCH_COMPLETED'
      puts "Batch completed: #{event_data[:jobId]}"
    when 'QUOTA_WARNING'
      puts "Quota warning: #{event_data[:remaining]} left"
    end
    
    status 200
  else
    status 401
    'Invalid signature'
  end
end
```

### API Usage Analytics

```ruby
# Get usage statistics
usage = client.get_usage

puts "Total verifications: #{usage[:total]}"
puts "Today: #{usage[:today]}"
puts "This month: #{usage[:this_month]}"
puts "Quota: #{usage[:quota]}"
puts "Remaining: #{usage[:remaining]}"

# Breakdown
breakdown = usage[:breakdown]
puts "Single: #{breakdown[:single]}"
puts "Bulk: #{breakdown[:bulk]}"
success_rate = (breakdown[:successful].to_f / usage[:total] * 100).round(1)
puts "Success rate: #{success_rate}%"

# Rate limit status
rate_limit = client.get_rate_limit_status
puts "Rate limit: #{rate_limit[:remaining]}/#{rate_limit[:limit]}"
```

### Smart Lists

```ruby
# Create a smart list
list = client.create_smart_list(
  name: 'Marketing Leads',
  description: 'Email list for Q4 campaign'
)

puts "Created list: #{list[:id]}"

# Add emails to list
client.add_emails_to_list(
  list_id: list[:id],
  emails: %w[lead1@example.com lead2@example.com]
)

# Get all lists
lists = client.get_smart_lists
lists.each do |list|
  puts "#{list[:name]}: #{list[:email_count]} emails"
end
```

### Error Handling

```ruby
begin
  result = client.verify_email('test@example.com')
rescue FKBounce::RateLimitError => e
  puts "Rate limit exceeded. Retry after #{e.retry_after} seconds"
rescue FKBounce::QuotaExceededError => e
  puts "Quota exceeded: #{e.message}"
rescue FKBounce::FKBounceError => e
  puts "API error: #{e.message}"
end
```

## Configuration

```ruby
client = FKBounce::EmailVerifier.new(
  api_key: 'your_api_key',
  base_url: 'https://api.fkbounce.com',  # Optional: custom endpoint
  timeout: 30,  # Request timeout in seconds
  max_retries: 3,  # Number of retry attempts
  retry_backoff: 2  # Exponential backoff multiplier
)
```

## GraphQL Direct Access

```ruby
# Execute custom GraphQL queries
query = <<~GRAPHQL
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
GRAPHQL

result = client.execute_graphql(query)
puts result[:data]

# With variables
mutation = <<~GRAPHQL
  mutation CreateList($name: String!, $description: String) {
    createSmartList(name: $name, description: $description) {
      id
      name
      created_at
    }
  }
GRAPHQL

result = client.execute_graphql(mutation, {
  name: 'New List',
  description: 'My email list'
})
```

## Rails Integration

```ruby
# config/initializers/fkbounce.rb
FKBounce.configure do |config|
  config.api_key = ENV['FKBOUNCE_API_KEY']
  config.timeout = 30
end

# app/services/email_verification_service.rb
class EmailVerificationService
  def initialize
    @client = FKBounce::EmailVerifier.new
  end
  
  def verify(email)
    @client.verify_email(email)
  end
end

# Usage in controller
class UsersController < ApplicationController
  def verify_email
    service = EmailVerificationService.new
    result = service.verify(params[:email])
    
    render json: result
  end
end

# Model validation
class User < ApplicationRecord
  validate :email_must_be_valid
  
  private
  
  def email_must_be_valid
    return unless email.present?
    
    verifier = FKBounce::EmailVerifier.new
    result = verifier.verify_email(email)
    
    unless result[:is_valid]
      errors.add(:email, 'is not a valid email address')
    end
  rescue FKBounce::FKBounceError
    # Handle API errors gracefully
    true
  end
end
```

## Sidekiq Background Job

```ruby
class EmailVerificationJob
  include Sidekiq::Job
  
  def perform(email_id)
    email = Email.find(email_id)
    client = FKBounce::EmailVerifier.new
    
    result = client.verify_email(email.address)
    
    email.update!(
      is_valid: result[:is_valid],
      reputation_score: result[:reputation_score],
      verified_at: Time.current
    )
  end
end

# Enqueue job
EmailVerificationJob.perform_async(email.id)
```

## RSpec Test Helpers

```ruby
require 'fkbounce/rspec'

RSpec.describe EmailVerificationService do
  include FKBounce::RSpec::Helpers
  
  it 'verifies email successfully' do
    stub_fkbounce_verify('test@example.com', is_valid: true, reputation_score: 95)
    
    service = EmailVerificationService.new
    result = service.verify('test@example.com')
    
    expect(result[:is_valid]).to be true
    expect(result[:reputation_score]).to eq 95
  end
  
  it 'handles invalid email' do
    stub_fkbounce_verify('invalid@example.com', is_valid: false)
    
    service = EmailVerificationService.new
    result = service.verify('invalid@example.com')
    
    expect(result[:is_valid]).to be false
  end
end
```

## Thread Safety

```ruby
require 'concurrent'

# The client is thread-safe
client = FKBounce::EmailVerifier.new(api_key: 'your_api_key')

# Verify emails concurrently
emails = ['user1@example.com', 'user2@example.com', 'user3@example.com']

results = Concurrent::Array.new

threads = emails.map do |email|
  Thread.new do
    result = client.verify_email(email)
    results << result
  end
end

threads.each(&:join)
puts "Verified #{results.count} emails"
```

## Development

```bash
# Install dependencies
bundle install

# Run tests
bundle exec rspec

# Run rubocop
bundle exec rubocop

# Build gem
gem build fkbounce-email-verifier.gemspec
```

## API Reference

Full documentation: <https://docs.fkbounce.com>

## Support

- Email: <support@fkbounce.com>
- GitHub: <https://github.com/fkbounce/ruby-sdk/issues>
- Documentation: <https://docs.fkbounce.com/sdks/ruby>

## License

MIT License
