import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: connection } = await supabase.from('integrations').select('*').eq('user_id', user.id).eq('provider', 'zapier').single()
    if (!connection) return NextResponse.json({ connected: false })

    return NextResponse.json({ connected: true, account_name: connection.account_name, account_email: connection.account_email })
  } catch (error) {
    return NextResponse.json({ connected: false })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await supabase.from('integrations').delete().eq('user_id', user.id).eq('provider', 'zapier')
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
