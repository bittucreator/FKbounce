'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import EmailVerifier from '@/components/EmailVerifier'
import BulkVerifier from '@/components/BulkVerifier'
import AppBreadcrumb from '@/components/AppBreadcrumb'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (!session?.user) {
        router.push('/login')
      } else {
        setUser(session.user)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, router])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="animate-pulse text-[#5C5855] font-mono">Loading...</div>
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b-[0.5px] bg-[#fafafa]">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
