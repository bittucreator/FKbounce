import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
      const supabase = await createClient()
      
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error) {
          return NextResponse.redirect(`${origin}${next}`)
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

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(`${request.url.split('?')[0].replace('/api/auth/callback', '')}/auth/auth-code-error`)
  }
}
