import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Verify list ownership
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Get emails in list
    const { data: emails, error, count } = await supabase
      .from('list_emails')
      .select('*', { count: 'exact' })
      .eq('list_id', params.id)
      .order('added_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      emails,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { emails } = body // Array of { email_address, verification_status, verification_result }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Emails array is required' }, { status: 400 })
    }

    // Verify list ownership
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Prepare emails for insertion
    const emailsToInsert = emails.map((email: any) => ({
      list_id: params.id,
      email_address: email.email_address,
      verification_status: email.verification_status || null,
      verification_result: email.verification_result || null
    }))

    // Insert emails (will skip duplicates due to UNIQUE constraint)
    const { data: insertedEmails, error } = await supabase
      .from('list_emails')
      .upsert(emailsToInsert, { onConflict: 'list_id,email_address' })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      added: insertedEmails?.length || 0,
      emails: insertedEmails
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const emailAddresses = searchParams.get('emails')?.split(',') || []

    if (emailAddresses.length === 0) {
      return NextResponse.json({ error: 'Email addresses required' }, { status: 400 })
    }

    // Verify list ownership
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Delete emails from list
    const { error } = await supabase
      .from('list_emails')
      .delete()
      .eq('list_id', params.id)
      .in('email_address', emailAddresses)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, removed: emailAddresses.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
