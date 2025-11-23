import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// GET /api/webhooks - List all webhook configurations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: webhooks, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Don't expose secrets in response
    const sanitizedWebhooks = webhooks?.map(webhook => ({
      ...webhook,
      secret: webhook.secret.substring(0, 8) + '...',
    }))

    return NextResponse.json({ webhooks: sanitizedWebhooks })
  } catch (error) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    )
  }
}

// POST /api/webhooks - Create new webhook configuration
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
    const { url, events } = body

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Valid URL is required' },
        { status: 400 }
      )
    }

    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Validate events
    const validEvents = ['bulk_verification_complete', 'verification_failed']
    const eventArray = Array.isArray(events) ? events : ['bulk_verification_complete']
    
    if (!eventArray.every(event => validEvents.includes(event))) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      )
    }

    // Generate secret
    const secret = crypto.randomBytes(32).toString('hex')

    const { data: webhook, error } = await supabase
      .from('webhook_configs')
      .insert({
        user_id: user.id,
        url,
        secret,
        events: eventArray,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      webhook,
      message: 'Webhook created successfully. Save the secret securely - it will not be shown again.'
    })
  } catch (error) {
    console.error('Error creating webhook:', error)
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    )
  }
}

// PATCH /api/webhooks - Update webhook configuration
export async function PATCH(request: NextRequest) {
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
    const { id, url, events, is_active } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      )
    }

    const updates: any = {}

    if (url !== undefined) {
      try {
        new URL(url)
        updates.url = url
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        )
      }
    }

    if (events !== undefined) {
      const validEvents = ['bulk_verification_complete', 'verification_failed']
      if (!Array.isArray(events) || !events.every(event => validEvents.includes(event))) {
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        )
      }
      updates.events = events
    }

    if (is_active !== undefined) {
      updates.is_active = is_active
    }

    const { data: webhook, error } = await supabase
      .from('webhook_configs')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Don't expose full secret
    const sanitizedWebhook = {
      ...webhook,
      secret: webhook.secret.substring(0, 8) + '...',
    }

    return NextResponse.json({ webhook: sanitizedWebhook })
  } catch (error) {
    console.error('Error updating webhook:', error)
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    )
  }
}

// DELETE /api/webhooks - Delete webhook configuration
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('webhook_configs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ message: 'Webhook deleted successfully' })
  } catch (error) {
    console.error('Error deleting webhook:', error)
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    )
  }
}
