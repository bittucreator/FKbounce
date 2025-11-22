'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'
import { User } from '@supabase/supabase-js'
import EmailVerifier from '../components/EmailVerifier'
import BulkVerifier from '../components/BulkVerifier'
import AppBreadcrumb from '../components/AppBreadcrumb'
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
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#eeeeee] relative px-4">
        {/* Desktop floating feature cards */}
        <div className="hidden xl:block absolute left-8 top-1/2 -translate-y-1/2 w-80 z-10">
          <div className="bg-white shadow-lg p-6 mb-10 border border-[#ececec]">
            <div className="flex items-center gap-3 mb-3">
              <img src="/Mail.svg" alt="Single" className="h-7 w-7" />
              <span className="font-mono text-lg font-semibold text-[#020202]">Single Verification</span>
            </div>
            <p className="text-sm text-[#5C5855] leading-relaxed">Instantly check if an email address is valid, disposable, or risky.</p>
          </div>
          <div className="bg-white shadow-lg p-6 border border-[#ececec]">
            <div className="flex items-center gap-3 mb-3">
              <img src="/bulk emails.svg" alt="Bulk" className="h-7 w-7" />
              <span className="font-mono text-lg font-semibold text-[#020202]">Bulk Verification</span>
            </div>
            <p className="text-sm text-[#5C5855] leading-relaxed">Upload a CSV or paste up to 1,000,000 emails for fast batch validation.</p>
          </div>
        </div>
        <div className="hidden xl:block absolute right-8 top-1/2 -translate-y-1/2 w-80 z-10">
          <div className="bg-white shadow-lg p-6 mb-10 border border-[#ececec]">
            <div className="flex items-center gap-3 mb-3">
              <img src="/pro.svg" alt="Pro" className="h-7 w-7" />
              <span className="font-mono text-lg font-semibold text-[#020202]">Pro Plan</span>
            </div>
            <p className="text-sm text-[#5C5855] leading-relaxed">Upgrade for 1,000,000 verifications/month, priority support, and more.</p>
          </div>
          <div className="bg-white shadow-lg p-6 border border-[#ececec]">
            <div className="flex items-center gap-3 mb-3">
              <img src="/csv-upload.svg" alt="CSV" className="h-7 w-7" />
              <span className="font-mono text-lg font-semibold text-[#020202]">CSV Upload</span>
            </div>
            <p className="text-sm text-[#5C5855] leading-relaxed">Drag & drop your CSV file for instant bulk email checks.</p>
          </div>
        </div>
        
        {/* Mobile feature cards - Top */}
        <div className="xl:hidden w-full max-w-sm mb-8 z-10">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white shadow-lg p-4 border border-[#ececec]">
              <div className="flex items-start gap-3">
                <img src="/Mail.svg" alt="Single" className="h-6 w-6 mt-1" />
                <div className="text-left">
                  <span className="font-mono text-sm font-semibold text-[#020202] block mb-1">Single Verification</span>
                  <p className="text-xs text-[#5C5855] leading-relaxed">Instantly check if an email address is valid, disposable, or risky.</p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg p-4 border border-[#ececec]">
              <div className="flex items-start gap-3">
                <img src="/bulk emails.svg" alt="Bulk" className="h-6 w-6 mt-1" />
                <div className="text-left">
                  <span className="font-mono text-sm font-semibold text-[#020202] block mb-1">Bulk Verification</span>
                  <p className="text-xs text-[#5C5855] leading-relaxed">Upload a CSV or paste up to 1,000,000 emails for fast batch validation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sign-in card */}
        <Card className="w-full max-w-md mx-4 h-[350px] z-20 mb-8 xl:mb-0 flex flex-col items-center justify-center">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/Logo-black.png" alt="FKbounce" className="h-12 w-auto" />
            </div>
            <CardTitle className="text-3xl font-[family-name:var(--font-geist)] text-[#020202]">
              FKbounce
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSignIn} 
              className="w-full items-center justify-center flex gap-2"
            >
              <Lock className="h-5 w-5" /> Sign in with Google
            </Button>
            <p className="text-center text-xs text-[#5C5855] font-mono">
              Sign in to start verifying email addresses.
            </p>
          </CardContent>
        </Card>
        
        {/* Mobile feature cards - Bottom */}
        <div className="xl:hidden w-full max-w-sm mt-8 z-10">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white shadow-lg p-4 border border-[#ececec]">
              <div className="flex items-start gap-3">
                <img src="/pro.svg" alt="Pro" className="h-6 w-6 mt-1" />
                <div className="text-left">
                  <span className="font-mono text-sm font-semibold text-[#020202] block mb-1">Pro Plan</span>
                  <p className="text-xs text-[#5C5855] leading-relaxed">Upgrade for 1,000,000 verifications/month, priority support, and more.</p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg p-4 border border-[#ececec]">
              <div className="flex items-start gap-3">
                <img src="/csv-upload.svg" alt="CSV" className="h-6 w-6 mt-1" />
                <div className="text-left">
                  <span className="font-mono text-sm font-semibold text-[#020202] block mb-1">CSV Upload</span>
                  <p className="text-xs text-[#5C5855] leading-relaxed">Drag & drop your CSV file for instant bulk email checks.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b bg-[#eeeeee]">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/Logo-black.png" alt="FKbounce" className="h-7 w-auto" />
              <h1 className="text-2xl font-[family-name:var(--font-geist)] text-[#020202]">
                FKbounce
              </h1>
            </button>
            <div className="ml-1">
              <AppBreadcrumb />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-10">
        <Tabs defaultValue="single" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-fit max-w-xs mx-auto rounded-[8px]">
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
