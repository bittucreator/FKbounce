'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'
import { User } from '@supabase/supabase-js'
import AuthButton from './AuthButton'
import UpgradeButton from './UpgradeButton'
import AppBreadcrumb from './AppBreadcrumb'

export default function NavigationWrapper() {
  const [user, setUser] = useState<User | null>(null)
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Fetch user plan
      if (user) {
        const { data: planData } = await supabase
          .from('user_plans')
          .select('plan')
          .eq('user_id', user.id)
          .single()
        
        if (planData) {
          setUserPlan(planData.plan)
        }
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Don't show navigation elements when loading or when user is not signed in
  if (loading || !user) {
    return null
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <UpgradeButton currentPlan={userPlan} />
        <AuthButton />
      </div>
    </>
  )
}
