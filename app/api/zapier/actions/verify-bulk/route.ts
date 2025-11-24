import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// POST /api/zapier/actions/verify-bulk - Verify multiple emails action
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
    let { emails } = body

    if (!emails) {
      return NextResponse.json(
        { error: 'Emails are required' },
        { status: 400 }
      )
    }

    // Parse emails from various formats (array, comma-separated, line-separated)
    let emailArray: string[] = []
    
    if (typeof emails === 'string') {
      // Split by commas, newlines, or semicolons
      emailArray = emails
        .split(/[,;\n]/)
        .map((e: string) => e.trim())
        .filter((e: string) => e.length > 0)
    } else if (Array.isArray(emails)) {
      emailArray = emails.map((e) => e.trim()).filter((e) => e.length > 0)
    } else {
      return NextResponse.json(
        { error: 'Invalid emails format' },
        { status: 400 }
      )
    }

    if (emailArray.length === 0) {
      return NextResponse.json(
        { error: 'No valid emails provided' },
        { status: 400 }
      )
    }

    // Call the existing bulk verify API with the API key
    const verifyResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-bulk-with-key`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ emails: emailArray }),
      }
    )

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json()
      return NextResponse.json(
        { error: errorData.error || 'Bulk verification failed' },
        { status: verifyResponse.status }
      )
    }

    const result = await verifyResponse.json()

    // Format response for Zapier
    return NextResponse.json({
      jobId: result.jobId,
      status: result.status || 'processing',
      totalEmails: emailArray.length,
      message: result.message || 'Bulk verification started',
      checkStatusUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-bulk/${result.jobId}`,
    })
  } catch (error) {
    console.error('Zapier bulk verify action error:', error)
    return NextResponse.json(
      { error: 'Failed to verify emails' },
      { status: 500 }
    )
  }
}
