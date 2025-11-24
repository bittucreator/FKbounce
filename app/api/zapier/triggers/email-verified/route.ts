import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// GET /api/zapier/triggers/email-verified - Poll for verified emails
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    // Validate API key and get user
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
    const since = searchParams.get('since') // timestamp for pagination
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get recent verifications
    let query = supabaseAdmin
      .from('verification_history')
      .select('*')
      .eq('user_id', apiKeyData.user_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (since) {
      query = query.gt('created_at', since)
    }

    const { data: verifications, error } = await query

    if (error) {
      throw error
    }

    // Format for Zapier (array of objects)
    const formattedResults = (verifications || []).map((v) => ({
      id: v.id,
      email: v.email,
      isValid: v.is_valid,
      reason: v.reason,
      syntax: v.syntax,
      dns: v.dns,
      smtp: v.smtp,
      isDisposable: v.is_disposable,
      isFreeProvider: v.is_free_provider,
      verifiedAt: v.created_at,
    }))

    return NextResponse.json(formattedResults)
  } catch (error) {
    console.error('Zapier trigger error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verifications' },
      { status: 500 }
    )
  }
}
