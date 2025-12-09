'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '../lib/supabase/client'
import { User } from '@supabase/supabase-js'
import AuthButton from './AuthButton'
import AppBreadcrumb from './AppBreadcrumb'
import { CommandMenu } from './CommandMenu'

export default function NavigationWrapper() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Don't show navigation elements when loading, when user is not signed in, or on landing page
  if (loading || !user || pathname === '/') {
    return null
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <CommandMenu />
        <AuthButton />
      </div>
    </>
  )
}
