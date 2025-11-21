# Subscription Database Setup

## Run this SQL in your Supabase SQL Editor

The updated `supabase-schema.sql` now includes a `subscriptions` table that tracks Dodo Payments subscriptions.

### To set up the database:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase-schema.sql`
5. Click **Run** to execute

### What's included:

#### `subscriptions` table:
- `user_id` - Links to auth.users
- `dodo_customer_id` - Dodo Payments customer ID
- `dodo_subscription_id` - Dodo Payments subscription ID (unique)
- `dodo_checkout_id` - Initial checkout session ID
- `status` - active, cancelled, expired, or pending
- `plan` - free or pro
- `billing_cycle` - monthly or yearly
- `current_period_start` - Subscription period start date
- `current_period_end` - Subscription period end date
- `cancel_at_period_end` - Whether subscription cancels at period end

#### Features:
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only view their own subscription
- ✅ Indexes for fast lookups
- ✅ Foreign key constraints for data integrity
- ✅ Automatic timestamps (created_at, updated_at)

### After running the schema:

The webhook handler (`/app/api/webhooks/dodo/route.ts`) will automatically:
- Create subscription records on successful checkout
- Update subscription status on renewals
- Handle cancellations
- Sync with user_plans table
