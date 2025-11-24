import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NotionClient } from '@/lib/notion-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Notion connection
    const { data: connection } = await supabase
      .from('notion_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'Notion not connected' }, { status: 400 })
    }

    if (!connection.selected_database_id) {
      return NextResponse.json({ error: 'No database selected' }, { status: 400 })
    }

    const body = await request.json()
    const { emails } = body

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const notionClient = new NotionClient(connection.access_token)

    // Check if it's a single email or bulk
    if (emails.length === 1) {
      const email = emails[0]
      await notionClient.addEmailToDatabase(
        connection.selected_database_id,
        {
          email: email.email,
          valid: email.valid,
          syntax: email.syntax,
          dns: email.dns,
          smtp: email.smtp,
          disposable: email.disposable,
          catch_all: email.catch_all,
          message: email.message,
          verified_at: email.verified_at || new Date().toISOString(),
        }
      )

      return NextResponse.json({
        success: true,
        saved: 1,
        message: 'Email saved to Notion',
      })
    } else {
      // Bulk save - map to correct format
      const formattedEmails = emails.map(email => ({
        email: email.email,
        valid: email.valid,
        syntax: email.syntax,
        dns: email.dns,
        smtp: email.smtp,
        disposable: email.disposable,
        catch_all: email.catch_all,
        message: email.message,
        verified_at: email.verified_at || new Date().toISOString(),
      }))

      const results = await notionClient.addBulkEmailsToDatabase(
        connection.selected_database_id,
        formattedEmails
      )

      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length

      return NextResponse.json({
        success: true,
        saved: successCount,
        failed: failureCount,
        total: emails.length,
        message: `Saved ${successCount}/${emails.length} emails to Notion`,
        results,
      })
    }
  } catch (error) {
    console.error('Error saving to Notion:', error)
    return NextResponse.json(
      { error: 'Failed to save to Notion' },
      { status: 500 }
    )
  }
}
