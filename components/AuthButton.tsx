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
import { LogOut, History, Key, BarChart3, FolderOpen, Settings } from 'lucide-react'
import { Kbd, KbdGroup } from '@/components/ui/kbd'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
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

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if user is logged in and G key is pressed
      if (!user || e.key !== 'g') return

      // Check if G is followed by another key
      const handleSecondKey = (e2: KeyboardEvent) => {
        e2.preventDefault()
        switch (e2.key.toLowerCase()) {
          case 'l':
            router.push('/lists')
            break
          case 'h':
            router.push('/history')
            break
          case 'a':
            router.push('/analytics')
            break
          case 'k':
            router.push('/api-keys')
            break
          case 's':
            router.push('/settings')
            break
        }
        document.removeEventListener('keydown', handleSecondKey)
      }

      document.addEventListener('keydown', handleSecondKey)
      setTimeout(() => {
        document.removeEventListener('keydown', handleSecondKey)
      }, 1000)
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [supabase.auth, user, router])

  const handleSignIn = async () => {
    // Always use current origin to avoid cross-domain cookie issues
    const redirectUrl = `${window.location.origin}/api/auth/callback`
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
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
      <Button onClick={handleSignIn} variant="outline" size="sm" className="flex items-center gap-2">
        <img src="/google.svg" alt="Google" className="h-4 w-4" />
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
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/lists')}>
          <FolderOpen className="mr-2 h-4 w-4" />
          <span>Lists</span>
          <KbdGroup className="ml-auto">
            <Kbd>G</Kbd>
            <Kbd>L</Kbd>
          </KbdGroup>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/history')}>
          <History className="mr-2 h-4 w-4" />
          <span>History</span>
          <KbdGroup className="ml-auto">
            <Kbd>G</Kbd>
            <Kbd>H</Kbd>
          </KbdGroup>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/analytics')}>
          <BarChart3 className="mr-2 h-4 w-4" />
          <span>Analytics</span>
          <KbdGroup className="ml-auto">
            <Kbd>G</Kbd>
            <Kbd>A</Kbd>
          </KbdGroup>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/api-keys')}>
          <Key className="mr-2 h-4 w-4" />
          <span>API</span>
          <KbdGroup className="ml-auto">
            <Kbd>G</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
          <KbdGroup className="ml-auto">
            <Kbd>G</Kbd>
            <Kbd>S</Kbd>
          </KbdGroup>
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
