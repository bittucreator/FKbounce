import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// POST /api/zapier/actions/verify-email - Verify single email action
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    // Validate API key
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: apiKeyData, error: apiKeyError } = await supabaseAdmin
      .from('api_keys')
      .select('user_id')
      .eq('key', apiKey)
      .single()

    if (apiKeyError || !apiKeyData) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Call the existing verify API with the API key
    const verifyResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-with-key`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ email }),
      }
    )

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json()
      return NextResponse.json(
        { error: errorData.error || 'Verification failed' },
        { status: verifyResponse.status }
      )
    }

    const result = await verifyResponse.json()

    // Format response for Zapier
    return NextResponse.json({
      id: result.id || Date.now().toString(),
      email: result.email,
      isValid: result.isValid,
      reason: result.reason,
      syntax: result.syntax,
      dns: result.dns,
      smtp: result.smtp,
      isDisposable: result.isDisposable,
      isFreeProvider: result.isFreeProvider,
      verifiedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Zapier verify action error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}
