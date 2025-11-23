import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user settings or create default
    let { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // No settings found, create default
      const { data: newSettings } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          enable_catch_all_check: true,
          smtp_timeout: 10000,
          max_retries: 3,
          enable_domain_cache: true
        })
        .select()
        .single()
      
      settings = newSettings
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { enable_catch_all_check, smtp_timeout, max_retries, enable_domain_cache } = body

    // Validate inputs
    if (smtp_timeout && (smtp_timeout < 5000 || smtp_timeout > 30000)) {
      return NextResponse.json(
        { error: 'SMTP timeout must be between 5000 and 30000 ms' },
        { status: 400 }
      )
    }

    if (max_retries && (max_retries < 0 || max_retries > 5)) {
      return NextResponse.json(
        { error: 'Max retries must be between 0 and 5' },
        { status: 400 }
      )
    }

    // Upsert settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        enable_catch_all_check: enable_catch_all_check ?? true,
        smtp_timeout: smtp_timeout ?? 10000,
        max_retries: max_retries ?? 3,
        enable_domain_cache: enable_domain_cache ?? true
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
