import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// GET /api/zapier/test - Test authentication
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    // Hash the API key for comparison
    const encoder = new TextEncoder()
    const data = encoder.encode(apiKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Validate API key
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: apiKeyData, error } = await supabaseAdmin
      .from('api_keys')
      .select('user_id, key_prefix, is_active')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single()

    if (error || !apiKeyData) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user_id: apiKeyData.user_id,
      key_prefix: apiKeyData.key_prefix,
    })
  } catch (error) {
    console.error('Zapier auth test error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
