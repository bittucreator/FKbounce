# BigQuery Rate Limit Fix for Supabase

## Problem
Your Supabase project is returning 556 errors because it exceeded BigQuery rate limits:
```
Job exceeded rate limits: Your project_and_region exceeded quota for creating jobs
```

## Why This Happens
- Supabase uses BigQuery for logging
- Free tier has limited quota (200 MB/day, 1,000 jobs/day)
- Every auth request creates a log entry
- Quota exhaustion causes auth service to fail

## Solutions

### Option 1: Disable Logging (Immediate Fix)
1. Go to Supabase Dashboard → Settings → API
2. Scroll to "Logging"
3. Toggle OFF:
   - ❌ Log auth requests
   - ❌ Log database queries
   - ❌ Log API requests
4. Save changes
5. **Wait 2-3 minutes** for changes to apply

### Option 2: Wait for Quota Reset
- BigQuery quotas reset daily (midnight Pacific Time)
- Your auth will work again after quota resets
- Not recommended if you need immediate access

### Option 3: Upgrade to Pro Plan
- Pro plan: $25/month
- Higher BigQuery quotas
- No auto-pausing
- Better for production apps

## Verify Fix

After disabling logs, test:
```bash
curl -s "https://bweoxorqfushlcahupog.supabase.co/auth/v1/health"
```

Should return: (empty response with 200 status)

Not: "Internal server error" with 556 status

## Prevention

### Reduce Log Volume:
1. Only enable logs when debugging
2. Use sampling (log 10% of requests)
3. Monitor quota usage in Supabase dashboard

### Local Development:
- Use local Supabase instance
- Reduces cloud quota usage
- Install: `npx supabase init && npx supabase start`

## Temporary Workaround (Until Logs Disabled)

Use email authentication instead of Google OAuth:
