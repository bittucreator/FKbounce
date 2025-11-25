import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'
    const type = searchParams.get('type')

    if (code) {
      const supabase = await createClient()
      
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error) {
          // Don't redirect here - return HTML that redirects client-side
          const redirectBase = 'https://app.fkbounce.com'
          const redirectUrl = type === 'recovery' ? `${redirectBase}/auth/reset-password` : `${redirectBase}${next}`
          
          return new Response(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta http-equiv="refresh" content="0;url=${redirectUrl}">
              </head>
              <body>
                <script>window.location.href = '${redirectUrl}';</script>
              </body>
            </html>
          `, {
            headers: { 'Content-Type': 'text/html' },
          })
        }
        
        // Log the error for debugging
        console.error('Auth callback error:', error)
      } catch (authError: any) {
        // Handle cases where Supabase returns non-JSON responses (e.g., "Internal server error")
        console.error('Auth exchange error:', authError)
        
        // Check if it's a JSON parse error indicating Supabase auth service issue
        if (authError.message?.includes('not valid JSON') || authError.originalError?.message?.includes('not valid JSON')) {
          console.error('Supabase auth service error - likely OAuth provider not configured')
        }
      }
    }

    // Return HTML redirect for error page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=/auth/auth-code-error">
        </head>
        <body>
          <script>window.location.href = '/auth/auth-code-error';</script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=/auth/auth-code-error">
        </head>
        <body>
          <script>window.location.href = '/auth/auth-code-error';</script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}
