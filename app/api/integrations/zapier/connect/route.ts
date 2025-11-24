import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.ZAPIER_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/zapier/callback`
  
  if (!clientId) {
    return NextResponse.redirect(new URL('/integrations?error=Zapier not configured', request.url))
  }

  const authUrl = `https://zapier.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
  return NextResponse.redirect(authUrl)
}
