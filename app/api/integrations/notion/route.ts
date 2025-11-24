import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NotionClient } from '@/lib/notion-client'

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

    // Get user's Notion connection
    const { data: connection } = await supabase
      .from('notion_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!connection) {
      return NextResponse.json({ connected: false })
    }

    // Get available databases
    const notionClient = new NotionClient(connection.access_token)
    const databases = await notionClient.listDatabases()

    return NextResponse.json({
      connected: true,
      workspace_name: connection.workspace_name,
      databases,
      selected_database_id: connection.selected_database_id,
    })
  } catch (error) {
    console.error('Error fetching Notion connection:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Notion connection' },
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
    const { database_id } = body

    if (!database_id) {
      return NextResponse.json(
        { error: 'Database ID is required' },
        { status: 400 }
      )
    }

    // Update selected database
    const { error } = await supabase
      .from('notion_connections')
      .update({ selected_database_id: database_id })
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating Notion database:', error)
    return NextResponse.json(
      { error: 'Failed to update database selection' },
      { status: 500 }
    )
  }
}

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

    // Delete Notion connection
    const { error } = await supabase
      .from('notion_connections')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting Notion:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Notion' },
      { status: 500 }
    )
  }
}
