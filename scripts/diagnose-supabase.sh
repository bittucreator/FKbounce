#!/bin/bash

echo "🔍 Supabase Project Diagnostics"
echo "================================"
echo ""

PROJECT_URL="https://bweoxorqfushlcahupog.supabase.co"

echo "1. Testing Auth Service Health..."
AUTH_HEALTH=$(curl -s -w "%{http_code}" "$PROJECT_URL/auth/v1/health" -o /dev/null)
echo "   Status: $AUTH_HEALTH"
if [ "$AUTH_HEALTH" = "200" ]; then
    echo "   ✅ Auth service is healthy"
elif [ "$AUTH_HEALTH" = "556" ]; then
    echo "   ❌ Auth service returning 556 - Project likely paused or misconfigured"
else
    echo "   ⚠️  Unexpected status code"
fi
echo ""

echo "2. Testing REST API..."
REST_STATUS=$(curl -s -w "%{http_code}" "$PROJECT_URL/rest/v1/" -o /dev/null)
echo "   Status: $REST_STATUS"
if [ "$REST_STATUS" = "200" ]; then
    echo "   ✅ REST API is healthy"
elif [ "$REST_STATUS" = "556" ]; then
    echo "   ❌ REST API returning 556 - Project issue confirmed"
fi
echo ""

echo "3. Testing Auth Settings Endpoint..."
SETTINGS=$(curl -s "$PROJECT_URL/auth/v1/settings")
if echo "$SETTINGS" | grep -q "external"; then
    echo "   ✅ Auth settings accessible"
    echo "   Settings preview:"
    echo "$SETTINGS" | head -c 200
elif echo "$SETTINGS" | grep -q "Internal server error"; then
    echo "   ❌ Auth settings returning error"
fi
echo ""
echo ""

echo "📋 Diagnosis Summary:"
echo "===================="
if [ "$AUTH_HEALTH" = "556" ] && [ "$REST_STATUS" = "556" ]; then
    echo ""
    echo "🚨 CRITICAL: Your Supabase project is returning 556 errors"
    echo ""
    echo "This typically means:"
    echo "  • Project is PAUSED (most common for free tier)"
    echo "  • Project was suspended due to inactivity"
    echo "  • There's a critical configuration error"
    echo ""
    echo "Action Required:"
    echo "  1. Go to: https://supabase.com/dashboard/project/bweoxorqfushlcahupog"
    echo "  2. Check if project shows 'PAUSED' status"
    echo "  3. Click 'Restore' or 'Unpause' button if present"
    echo "  4. Wait 2-3 minutes for project to fully restart"
    echo ""
    echo "For free tier projects:"
    echo "  • Projects auto-pause after 7 days of inactivity"
    echo "  • You need to manually unpause them"
    echo "  • Consider upgrading to Pro ($25/mo) to prevent auto-pausing"
    echo ""
else
    echo "   ⚠️  Partial failure - some endpoints working"
fi
