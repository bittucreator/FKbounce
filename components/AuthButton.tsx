'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LogOut, History, CreditCard, Key, BarChart3, FolderOpen, Settings } from 'lucide-react'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [userPlan, setUserPlan] = useState<string>('free')
  const [emailsUsed, setEmailsUsed] = useState<number>(0)
  const [emailsLimit, setEmailsLimit] = useState<number>(500)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Fetch user plan
      if (user) {
        const { data: planData } = await supabase
          .from('user_plans')
          .select('plan, verifications_used, verifications_limit')
          .eq('user_id', user.id)
          .single()
        
        if (planData) {
          setUserPlan(planData.plan)
          setEmailsUsed(planData.verifications_used || 0)
          setEmailsLimit(planData.verifications_limit || 500)
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

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) {
      console.error('Error signing in:', error.message)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!user) {
    return (
      <Button onClick={handleSignIn} variant="outline" size="sm">
        Sign in with Google
      </Button>
    )
  }

  const userInitials = user.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user.email?.substring(0, 2).toUpperCase() || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          {userPlan === 'pro' && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0 text-[10px] h-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-0 font-bold">
              PRO
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">
                {user.user_metadata?.full_name || 'User'}
              </p>
              {userPlan === 'pro' && (
                <Badge className="px-1.5 py-0 text-[10px] h-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-0 font-bold">
                  PRO
                </Badge>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">
                  {emailsUsed.toLocaleString()} / {emailsLimit.toLocaleString()} emails
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((emailsUsed / emailsLimit) * 100)}%
                </p>
              </div>
              <Progress value={(emailsUsed / emailsLimit) * 100} className="h-2" />
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/lists')}>
          <FolderOpen className="mr-2 h-4 w-4" />
          <span>Smart Lists</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/history')}>
          <History className="mr-2 h-4 w-4" />
          <span>Verification History</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/analytics')}>
          <BarChart3 className="mr-2 h-4 w-4" />
          <span>Usage Analytics</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/api-keys')}>
          <Key className="mr-2 h-4 w-4" />
          <span>API Keys</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/integrations')}>
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
          <span>Integrations</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/subscription')}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Manage Subscription</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
