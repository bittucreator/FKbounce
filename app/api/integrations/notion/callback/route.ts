import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForToken } from '@/lib/notion-client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?notion_error=${error}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?notion_error=no_code`
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?notion_error=not_authenticated`
      )
    }

    // Exchange code for access token
    const connection = await exchangeCodeForToken(code)

    // Save connection to database
    await supabase
      .from('notion_connections')
      .upsert({
        user_id: user.id,
        access_token: connection.access_token,
        workspace_name: connection.workspace_name,
        workspace_icon: connection.workspace_icon,
        bot_id: connection.bot_id,
      })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/integrations?notion_success=true`
    )
  } catch (error) {
    console.error('Notion OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/integrations?notion_error=connection_failed`
    )
  }
}
