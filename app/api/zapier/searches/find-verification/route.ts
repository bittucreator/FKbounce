import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// GET /api/zapier/searches/find-verification - Find verification by email
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Search for verification
    const { data: verification, error } = await supabaseAdmin
      .from('verification_history')
      .select('*')
      .eq('user_id', apiKeyData.user_id)
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      )
    }

    // Format for Zapier
    return NextResponse.json({
      id: verification.id,
      email: verification.email,
      isValid: verification.is_valid,
      reason: verification.reason,
      syntax: verification.syntax,
      dns: verification.dns,
      smtp: verification.smtp,
      isDisposable: verification.is_disposable,
      isFreeProvider: verification.is_free_provider,
      verifiedAt: verification.created_at,
    })
  } catch (error) {
    console.error('Zapier search error:', error)
    return NextResponse.json(
      { error: 'Failed to find verification' },
      { status: 500 }
    )
  }
}
