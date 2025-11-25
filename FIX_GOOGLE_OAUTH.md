# Fix Google OAuth in Production

## Issue

Getting 401 Unauthorized error when Google redirects back to production:
`https://app.fkbounce.com/api/auth/callback`

## Solution

### Step 1: Update Supabase Auth Settings

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to **Redirect URLs** (these are the URLs Supabase will redirect to after OAuth):

   ```
   https://app.fkbounce.com/api/auth/callback
   http://localhost:3000/api/auth/callback
   ```

3. Set **Site URL** to: `https://fkbounce.com` (your main domain)
4. Click **Save**

**Important**: 
- `app.fkbounce.com` is only used for the OAuth callback, not as the main site
- After successful login, users stay on `app.fkbounce.com`

### Step 2: Update Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:

   ```
   https://werrghjeeplqrhmuayjc.supabase.co/auth/v1/callback
   https://app.fkbounce.com/api/auth/callback
   ```

5. Click **Save**

### Step 3: Verify Environment Variables

Make sure your production environment has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://werrghjeeplqrhmuayjc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 4: Clear Cache and Redeploy

1. Clear your production deployment cache
2. Redeploy your app
3. Test Google sign-in again

## Testing

1. Go to your main site (https://fkbounce.com)
2. Click "Get Started" → redirects to `/login`
3. Click "Sign in with Google"
4. After Google auth, should redirect to `https://app.fkbounce.com/dashboard`
5. User stays on `app.fkbounce.com` for the application

## Common Issues

**Still getting 401?**

- Check if Supabase project has Google provider enabled
- Verify Google OAuth Client ID and Secret are set in Supabase
- Ensure redirect URLs match exactly (no trailing slashes)

**"redirect_uri_mismatch" error?**

- The redirect URI in Google Console must match Supabase's callback URL exactly
