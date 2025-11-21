'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'
import { User } from '@supabase/supabase-js'
import EmailVerifier from '../components/EmailVerifier'
import BulkVerifier from '../components/BulkVerifier'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Mail, Shield, Lock } from 'lucide-react'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#eeeeee]">
        <div className="animate-pulse text-[#5C5855] font-mono">Loading...</div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#eeeeee]">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/Logo-black.png" alt="FKbounce" className="h-12 w-auto" />
            </div>
            <CardTitle className="text-3xl font-[family-name:var(--font-geist)] text-[#020202]">
              FKbounce
            </CardTitle>
            <CardDescription className="font-[family-name:var(--font-geist-mono)] text-[#5C5855] text-[14px] leading-[21px] tracking-[-0.4px] h-[25px]">
              Email Verification Platform You Can Trust
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSignIn} 
              className="w-full"
              size="lg"
            >
              Sign in with Google
            </Button>
            <p className="text-center text-xs text-[#5C5855] font-mono">
              Sign in to start verifying email addresses.
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b bg-[#eeeeee]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/Logo-black.png" alt="FKbounce" className="h-10 w-auto" />
            <h1 className="text-4xl font-[family-name:var(--font-geist)] text-[#020202]">
              FKbounce
            </h1>
          </div>
          <p className="text-center font-[family-name:var(--font-geist-mono)] text-[#5C5855] text-[14px] leading-[16px] tracking-[-0.2px] h-[25px]">
            Email Verification Platform You Can Trust.
          </p>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-10">
        <Tabs defaultValue="single" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="single">
              <Mail className="h-4 w-4 mr-2" />
              Single Verification
            </TabsTrigger>
            <TabsTrigger value="bulk">
              <Shield className="h-4 w-4 mr-2" />
              Bulk Verification
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
