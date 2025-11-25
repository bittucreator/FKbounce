'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '../../components/ui/button'
import AppBreadcrumb from '../../components/AppBreadcrumb'

export default function TermsOfService() {
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
    // Always use current origin to avoid cross-domain cookie issues
    const redirectUrl = `${window.location.origin}/api/auth/callback`
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    })
    if (error) console.error('Error signing in:', error.message)
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Header */}
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

      {/* Terms of Service Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 font-mono uppercase text-[#020202]">
            Terms of Service
          </h1>
          
          <div className="mb-12">
            <p className="text-[#5C5855] mb-4 font-mono"><strong>EFFECTIVE DATE:</strong> NOVEMBER 22, 2025</p>
            <p className="text-[#5C5855] leading-relaxed font-mono">
              By accessing and using FKBounce, you agree to be bound by these Terms of Service. Please read them carefully.
            </p>
          </div>

          <div className="space-y-12">
            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">1. SERVICE DESCRIPTION</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  FKBounce provides email verification services to help you validate email addresses for syntax, domain validity, MX records, and deliverability. Our service includes single email verification, bulk verification via CSV upload, RESTful API access, and analytics dashboard.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">2. USER ACCOUNTS</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  You must sign in with a valid Google account to use our service. You are responsible for maintaining the security of your account and all activities that occur under your account. You must notify us immediately of any unauthorized use.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">3. USAGE LIMITS AND FAIR USE</h2>
              <div className="text-[#5C5855] space-y-3 font-mono">
                <p className="leading-relaxed">
                  <strong>FREE PLAN:</strong> 500 email verifications per month, API rate limit of 120 requests per minute
                </p>
                <p className="leading-relaxed">
                  <strong>PRO PLAN:</strong> 1,000,000 email verifications per month, API rate limit of 600 requests per minute
                </p>
                <p className="leading-relaxed">
                  Excessive or abusive use that degrades service performance may result in rate limiting or account suspension.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">4. ACCEPTABLE USE POLICY</h2>
              <div className="text-[#5C5855] space-y-3 font-mono">
                <p className="leading-relaxed">You agree not to use FKBounce to:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Send spam or unsolicited commercial emails</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt our service</li>
                  <li>Use the service for illegal activities</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">5. PAYMENT AND BILLING</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  Pro plan subscriptions are billed monthly through our payment processor Dodo Payments. Payments are non-refundable except as required by law. We reserve the right to change pricing with 30 days notice.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">6. SERVICE AVAILABILITY</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  While we strive for 99.9% uptime, we do not guarantee uninterrupted service. We may perform scheduled maintenance and updates that may temporarily affect availability.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">7. TERMINATION</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  We reserve the right to suspend or terminate your account at any time for violation of these Terms. You may cancel your account at any time through your account settings. Upon termination, your access to the service will cease immediately.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">8. LIMITATION OF LIABILITY</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  FKBounce is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, consequential, or punitive damages arising from your use of the service. Our total liability shall not exceed the amount you paid us in the past 12 months.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">9. INDEMNIFICATION</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  You agree to indemnify and hold harmless FKBounce from any claims, damages, or expenses arising from your use of the service or violation of these Terms.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">10. CHANGES TO TERMS</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  We may modify these Terms at any time. Continued use of the service after changes constitutes acceptance of the modified Terms.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">11. GOVERNING LAW</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or your use of the service shall be resolved through binding arbitration.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">12. CONTACT</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  For questions about these Terms, please contact us at support@fkbounce.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
    </div>
  )
}
