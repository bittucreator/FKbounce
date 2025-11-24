'use client'

import type { Metadata } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import AppBreadcrumb from '@/components/AppBreadcrumb'

/* export const metadata: Metadata = {
  title: 'Compare Email Verification Tools | FKbounce Alternatives',
  description: 'Compare FKbounce with ZeroBounce, Hunter.io, Kickbox, NeverBounce, and other email verification tools. See features, pricing, and why FKbounce is the best affordable alternative.',
  keywords: [
    'email verification comparison',
    'zerobounce alternative',
    'hunter.io alternative',
    'kickbox alternative',
    'neverbounce alternative',
    'bouncer alternative',
    'email validator comparison',
    'best email verification tool',
    'cheap email verification',
    'affordable email validator',
  ],
  openGraph: {
    title: 'Compare Email Verification Tools - FKbounce vs Competitors',
    description: 'See how FKbounce compares to ZeroBounce, Hunter.io, and other email verification tools. Better pricing, same features.',
  },
} */

export default function ComparePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) console.error('Error signing in:', error.message)
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b-[0.5px] bg-[#fafafa]">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src="/Logo-dark.svg" alt="FKbounce" className="h-7 w-auto" />
              </button>
              <div className="ml-1">
                <AppBreadcrumb />
              </div>
            </div>
            {!user && (
              <Button onClick={handleSignIn} variant="default" size="sm">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 bg-[#fafafa] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#020202] mb-4">
            Email Verification Tool Comparison
          </h1>
          <p className="text-lg text-[#5C5855] max-w-3xl mx-auto">
            Compare FKbounce with leading email verification services. Same enterprise features, better pricing.
          </p>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <table className="w-full bg-white rounded-[12px] shadow-sm border border-[#ececec] text-sm">
            <thead className="bg-[#f4f4f4]">
              <tr>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-[#020202] whitespace-nowrap">Feature</th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm font-semibold text-[#020202] whitespace-nowrap">FKbounce</th>
                <th className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm text-[#5C5855] whitespace-nowrap">NeverBounce</th>
                <th className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm text-[#5C5855] whitespace-nowrap">ZeroBounce</th>
                <th className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm text-[#5C5855] whitespace-nowrap">Bounce Bean</th>
                <th className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm text-[#5C5855] whitespace-nowrap">Bouncer</th>
                <th className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm text-[#5C5855] whitespace-nowrap">Kickbox</th>
                <th className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm text-[#5C5855] whitespace-nowrap">Validity</th>
                <th className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm text-[#5C5855] whitespace-nowrap">Hunter.io</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec]">
              <tr>
                <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap">Price (1M verifications)</td>
                <td className="px-3 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm text-green-600 font-bold whitespace-nowrap">$15</td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm whitespace-nowrap">$2,500</td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm whitespace-nowrap">$2,250</td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm whitespace-nowrap">$1,450</td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm whitespace-nowrap">$2,000</td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm whitespace-nowrap">$4,000</td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm whitespace-nowrap">$4,000+</td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm whitespace-nowrap">$11,000</td>
              </tr>
              <tr>
                <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap">Free Plan</td>
                <td className="px-3 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm"><div className="flex items-center justify-center gap-1"><img src="/green-check.svg" alt="Yes" className="w-4 h-4 text-green-600" style={{color: '#16a34a'}} /> <span className="whitespace-nowrap">500/mo</span></div></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><div className="flex items-center justify-center gap-1"><img src="/green-check.svg" alt="Yes" className="w-4 h-4 text-green-600" style={{color: '#16a34a'}} /> <span className="whitespace-nowrap">1K/credits</span></div></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><div className="flex items-center justify-center gap-1"><img src="/green-check.svg" alt="Yes" className="w-4 h-4 text-green-600" style={{color: '#16a34a'}} /> <span className="whitespace-nowrap">100/credits</span></div></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><div className="flex items-center justify-center gap-1"><img src="/green-check.svg" alt="Yes" className="w-4 h-4 text-green-600" style={{color: '#16a34a'}} /> <span className="whitespace-nowrap">100/credits</span></div></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/close.svg" alt="No" className="w-4 h-4 mx-auto" /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/close.svg" alt="No" className="w-4 h-4 mx-auto" /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/close.svg" alt="No" className="w-4 h-4 mx-auto" /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><div className="flex items-center justify-center gap-1"><img src="/green-check.svg" alt="Yes" className="w-4 h-4 text-green-600" style={{color: '#16a34a'}} /> <span className="whitespace-nowrap">50/credits</span></div></td>
              </tr>
              <tr>
                <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap">Real-time SMTP</td>
                <td className="px-3 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
              </tr>
              <tr>
                <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap">Bulk Verification</td>
                <td className="px-3 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
              </tr>
              <tr>
                <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap">API Access</td>
                <td className="px-3 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm"><div className="flex items-center justify-center gap-1"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 text-green-600" style={{color: '#16a34a'}} /> <span className="whitespace-nowrap">Unlimited</span></div></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
              </tr>
              <tr>
                <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap">Catch-all Detection</td>
                <td className="px-3 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
              </tr>
              <tr>
                <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap">Disposable Detection</td>
                <td className="px-3 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
              </tr>
              <tr>
                <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap">Zapier</td>
                <td className="px-3 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/close.svg" alt="No" className="w-5 h-5 mx-auto" /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
              </tr>
              <tr>
                <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap">Webhooks</td>
                <td className="px-3 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/close.svg" alt="No" className="w-5 h-5 mx-auto" /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/green-check.svg" alt="Yes" className="w-5 h-5 mx-auto text-green-600" style={{color: '#16a34a'}} /></td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm"><img src="/close.svg" alt="No" className="w-5 h-5 mx-auto" /></td>
              </tr>
              <tr>
                <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap">Value Rating</td>
                <td className="px-3 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm">
                  <div className="flex items-center justify-center gap-0.5">
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                  </div>
                </td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm">
                  <div className="flex items-center justify-center gap-0.5">
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                  </div>
                </td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm">
                  <div className="flex items-center justify-center gap-0.5">
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                  </div>
                </td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm">
                  <div className="flex items-center justify-center gap-0.5">
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                  </div>
                </td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm">
                  <div className="flex items-center justify-center gap-0.5">
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                  </div>
                </td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm">
                  <div className="flex items-center justify-center gap-0.5">
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                  </div>
                </td>
                <td className="px-2 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm">
                  <div className="flex items-center justify-center gap-0.5">
                    <img src="/star.svg" alt="star" className="w-5 h-5" style={{color: '#eab308'}} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-3xl font-bold text-[#020202] mb-4">
            Why Choose FKbounce?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-[12px] border border-[#ececec]">
              <h3 className="font-bold text-xl mb-3 text-[#020202]">99% Cost Savings</h3>
              <p className="text-[#5C5855]">
                At just $15 for 1M verifications, FKbounce is 99% cheaper than Hunter.io ($11,000), 99% cheaper than Kickbox/Validity ($4,000), and 99% cheaper than competitors charging $2,000-$2,500. Save thousands per month on email verification.
              </p>
            </div>
            <div className="bg-white p-6 rounded-[12px] border border-[#ececec]">
              <h3 className="font-bold text-xl mb-3 text-[#020202]">Same Accuracy</h3>
              <p className="text-[#5C5855]">
                98%+ accuracy with real-time SMTP verification. Our validation is as reliable as any premium service.
              </p>
            </div>
            <div className="bg-white p-6 rounded-[12px] border border-[#ececec]">
              <h3 className="font-bold text-xl mb-3 text-[#020202]">Better Support</h3>
              <p className="text-[#5C5855]">
                Fast, responsive customer support. We're a growing company that actually cares about your success.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#020202] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-[#5C5855]">
              Everything you need to know about FKbounce email verification
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-[#020202] mb-4">General</h3>
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="general-1" className="bg-white border border-[#ececec] rounded-[12px] px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-[#020202]">What is email verification?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-[#5C5855] pb-4">
                    Email verification is the process of checking if an email address is valid, deliverable, and safe to send to. It includes syntax validation, DNS/MX record checking, SMTP mailbox verification, disposable email detection, and catch-all domain detection.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="general-2" className="bg-white border border-[#ececec] rounded-[12px] px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-[#020202]">Why do I need email verification?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-[#5C5855] pb-4">
                    Email verification helps you: reduce bounce rates by 95%, improve email deliverability, protect your sender reputation, save money on email sends, increase engagement rates, avoid spam traps, and ensure your email list quality.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="general-3" className="bg-white border border-[#ececec] rounded-[12px] px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-[#020202]">How accurate is FKbounce?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-[#5C5855] pb-4">
                    FKbounce maintains 98%+ accuracy through real-time SMTP verification. We use direct mailbox checking, not just syntax validation, ensuring the highest accuracy in the industry.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-[#020202] mb-4">Pricing & Plans</h3>
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="pricing-1" className="bg-white border border-[#ececec] rounded-[12px] px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-[#020202]">Do you offer a free plan?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-[#5C5855] pb-4">
                    Yes! Our free plan includes 500 email verifications per month with all basic features. No credit card required.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="pricing-2" className="bg-white border border-[#ececec] rounded-[12px] px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-[#020202]">How does your pricing compare to competitors?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-[#5C5855] pb-4">
                    FKbounce is 99% cheaper than most competitors. We charge just $15 for 1 million verifications, compared to $11,000 at Hunter.io, $4,000 at Kickbox/Validity, $2,500 at NeverBounce, $2,250 at ZeroBounce, $2,000 at Bouncer, and $1,450 at Bounce Bean. That's massive savings without compromising on quality.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="pricing-3" className="bg-white border border-[#ececec] rounded-[12px] px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-[#020202]">Can I cancel anytime?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-[#5C5855] pb-4">
                    Yes, you can cancel your subscription at any time. No questions asked, no cancellation fees.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-[#020202] mb-4">Features</h3>
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="features-1" className="bg-white border border-[#ececec] rounded-[12px] px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-[#020202]">Can I verify emails in bulk?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-[#5C5855] pb-4">
                    Yes! Upload CSV files or paste up to 1 million emails for batch verification. Results are processed quickly and can be exported in CSV, JSON, or Excel format.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="features-2" className="bg-white border border-[#ececec] rounded-[12px] px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-[#020202]">Do you have an API?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-[#5C5855] pb-4">
                    Yes, we provide a RESTful API with unlimited requests (within your monthly quota). Perfect for integrating email verification into your applications.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="features-3" className="bg-white border border-[#ececec] rounded-[12px] px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-[#020202]">Can I integrate with Zapier?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-[#5C5855] pb-4">
                    Yes, FKbounce supports Zapier integration for automating email verification workflows without coding.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-[#020202] mb-4">Security & Privacy</h3>
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="security-1" className="bg-white border border-[#ececec] rounded-[12px] px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-[#020202]">Is my data secure?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-[#5C5855] pb-4">
                    Yes, all data is encrypted in transit (TLS/SSL) and at rest. We never store the actual email addresses longer than necessary for verification.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="security-2" className="bg-white border border-[#ececec] rounded-[12px] px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-[#020202]">Do you sell or share email lists?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-[#5C5855] pb-4">
                    Never. Your data is yours. We do not sell, rent, or share your email lists with anyone.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="security-3" className="bg-white border border-[#ececec] rounded-[12px] px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-[#020202]">Are you GDPR compliant?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-[#5C5855] pb-4">
                    Yes, FKbounce is fully GDPR compliant. We process data according to European privacy regulations.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <div className="mt-12 text-center bg-white p-8 rounded-[12px] border border-[#ececec]">
            <h3 className="text-2xl font-bold text-[#020202] mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-[#5C5855] mb-6">
              Start verifying emails today with 500 free verifications.
            </p>
            <Link href="/">
              <Button size="lg">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#5C5855]">
            <p className="font-mono">© 2025 FKBounce. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/compare" className="hover:text-[#020202] transition-colors font-mono">
                Compare
              </Link>
              <Link href="/privacy" className="hover:text-[#020202] transition-colors font-mono">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[#020202] transition-colors font-mono">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
