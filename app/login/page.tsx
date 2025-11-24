'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import EmailVerifier from '@/components/EmailVerifier'
import BulkVerifier from '@/components/BulkVerifier'
import SmartLists from '@/components/SmartLists'
import AppBreadcrumb from '@/components/AppBreadcrumb'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Shield, Lock } from 'lucide-react'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
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
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignIn = async () => {
    // Use app.fkbounce.com for production, otherwise use current origin
    const redirectUrl = typeof window !== 'undefined' && window.location.hostname.includes('fkbounce.com')
      ? 'https://app.fkbounce.com/api/auth/callback'
      : `${window.location.origin}/api/auth/callback`
    
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      if (authMode === 'reset') {
        // Use app.fkbounce.com for production, otherwise use current origin
        const redirectUrl = typeof window !== 'undefined' && window.location.hostname.includes('fkbounce.com')
          ? 'https://app.fkbounce.com/auth/reset-password'
          : `${window.location.origin}/auth/reset-password`
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        })
        if (error) throw error
        setAuthError('Check your email for the password reset link!')
        setEmail('')
      } else if (authMode === 'signup') {
        // Use app.fkbounce.com for production, otherwise use current origin
        const redirectUrl = typeof window !== 'undefined' && window.location.hostname.includes('fkbounce.com')
          ? 'https://app.fkbounce.com/api/auth/callback'
          : `${window.location.origin}/api/auth/callback`
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
            },
          },
        })
        if (error) throw error
        setAuthError('Check your email to confirm your account!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error: any) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#ffffff]">
        <div className="animate-pulse text-[#5C5855] font-mono">Loading...</div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] relative px-4 overflow-hidden">
        
        {/* Sign-in card */}
        <Card className="w-full max-w-md mx-auto z-20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img src="/Mainlogo.png" alt="FKbounce" className="h-12 w-auto" />
            </div>
            <CardTitle className="text-2xl">Welcome to FKbounce</CardTitle>
            <CardDescription>Sign in to start verifying email addresses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSignIn} 
              variant="outline"
              className="w-full items-center justify-center flex gap-2"
            >
              <img src="/google.svg" alt="Google" className="h-4 w-4" /> Continue with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={authLoading}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={authLoading}
                />
              </div>
              {authMode !== 'reset' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={authLoading}
                    minLength={6}
                  />
                </div>
              )}
              
              {authMode === 'signin' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('reset')
                      setAuthError('')
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              
              {authError && (
                <p className={`text-xs text-center ${authError.includes('Check your email') ? 'text-green-600' : 'text-red-600'}`}>
                  {authError}
                </p>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={authLoading}
              >
                {authLoading ? 'Loading...' : 
                 authMode === 'reset' ? 'Send Reset Link' :
                 authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'reset' ? 'signin' : authMode === 'signin' ? 'signup' : 'signin')
                  setAuthError('')
                }}
                className="text-primary hover:underline"
              >
                {authMode === 'reset' ? 'Back to sign in' :
                 authMode === 'signin' ? "Don't have an account? Sign up" : 
                 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b-[0.5px] bg-[#fafafa]">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/Logo-dark.svg" alt="FKbounce" className="h-7 w-auto" />
            </button>
            <div className="ml-1">
              <AppBreadcrumb />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-10">
        <Tabs defaultValue="single" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-fit max-w-lg mx-auto rounded-[8px]">
            <TabsTrigger value="single" className="text-sm rounded-[8px] flex items-center justify-center">
              <img src="/Mail.svg" alt="" className="h-6 w-6 mr-1.5" />
              Single
            </TabsTrigger>
            <TabsTrigger value="bulk" className="text-sm rounded-[8px] flex items-center justify-center">
              <img src="/bulk emails.svg" alt="" className="h-6 w-6 mr-1.5" />
              Bulk
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="mt-0">
            <EmailVerifier />
          </TabsContent>
          
          <TabsContent value="bulk" className="mt-0">
            <BulkVerifier />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
