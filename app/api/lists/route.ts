import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: lists, error } = await supabase
      .from('lists')
      .select(`
        *,
        email_count:list_emails(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the response to include email count
    const formattedLists = lists.map((list: any) => ({
      ...list,
      email_count: list.email_count?.[0]?.count || 0
    }))

    return NextResponse.json({ lists: formattedLists })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, color } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 })
    }

    const { data: list, error } = await supabase
      .from('lists')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3b82f6'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ list })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
