import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/', request.url))

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    if (!code) return NextResponse.redirect(new URL('/integrations?error=Authorization failed', request.url))

    await supabase.from('integrations').upsert({
      user_id: user.id,
      provider: 'zapier',
      access_token: 'placeholder',
      refresh_token: 'placeholder',
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      account_name: 'Zapier Account',
      account_email: user.email,
    }, { onConflict: 'user_id,provider' })

    return NextResponse.redirect(new URL('/integrations?success=true&integration=Zapier', request.url))
  } catch (error) {
    return NextResponse.redirect(new URL('/integrations?error=Failed to connect', request.url))
  }
}
