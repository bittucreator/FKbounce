'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '../../components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import AppBreadcrumb from '../../components/AppBreadcrumb'

export default function PrivacyPolicy() {
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

      {/* Privacy Policy Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 font-[family-name:var(--font-geist)] text-[#020202]">
            Privacy Policy
          </h1>
          
          <div className="mb-8 bg-white p-6 rounded-[12px] border border-[#ececec]">
            <p className="text-[#5C5855] mb-4"><strong>Effective Date:</strong> November 22, 2025</p>
            <p className="text-[#5C5855] leading-relaxed">
              FKBounce ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our email verification service.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="item-1" className="bg-white border border-[#ececec] rounded-[12px] px-6">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-semibold text-[#020202]">1. Information We Collect</span>
              </AccordionTrigger>
              <AccordionContent className="text-[#5C5855] pb-4 space-y-3">
                <p className="leading-relaxed">
                  <strong>Account Information:</strong> When you sign in with Google OAuth, we collect your name, email address, and profile picture from your Google account.
                </p>
                <p className="leading-relaxed">
                  <strong>Verification Data:</strong> Email addresses you submit for verification, verification results, and usage statistics. We store this information to provide analytics and maintain your verification history.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white border border-[#ececec] rounded-[12px] px-6">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-semibold text-[#020202]">2. How We Use Your Information</span>
              </AccordionTrigger>
              <AccordionContent className="text-[#5C5855] pb-4">
                <ul className="list-disc list-inside space-y-2">
                  <li>To authenticate and manage your account</li>
                  <li>To provide email verification services</li>
                  <li>To generate analytics and usage reports</li>
                  <li>To enforce rate limits and prevent abuse</li>
                  <li>To improve our service and develop new features</li>
                  <li>To communicate important updates about our service</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white border border-[#ececec] rounded-[12px] px-6">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-semibold text-[#020202]">3. Data Storage and Security</span>
              </AccordionTrigger>
              <AccordionContent className="text-[#5C5855] pb-4">
                <p className="leading-relaxed">
                  Your data is stored securely on Supabase (PostgreSQL) with encryption at rest and in transit. We implement industry-standard security measures including secure authentication tokens, API rate limiting, and regular security audits. Access to your data is restricted to authorized personnel only.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white border border-[#ececec] rounded-[12px] px-6">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-semibold text-[#020202]">4. Data Sharing and Disclosure</span>
              </AccordionTrigger>
              <AccordionContent className="text-[#5C5855] pb-4 space-y-3">
                <p className="leading-relaxed">
                  We do not sell, rent, or share your personal information with third parties for their marketing purposes. We may share information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>With service providers who help us operate our service (e.g., hosting, authentication)</li>
                  <li>When required by law or to respond to legal process</li>
                  <li>To protect our rights, property, or safety, or that of our users</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-white border border-[#ececec] rounded-[12px] px-6">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-semibold text-[#020202]">5. Your Rights and Choices</span>
              </AccordionTrigger>
              <AccordionContent className="text-[#5C5855] pb-4 space-y-3">
                <p className="leading-relaxed">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Access your personal data and verification history</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your account and associated data</li>
                  <li>Export your verification data</li>
                  <li>Opt out of non-essential communications</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-white border border-[#ececec] rounded-[12px] px-6">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-semibold text-[#020202]">6. Data Retention</span>
              </AccordionTrigger>
              <AccordionContent className="text-[#5C5855] pb-4">
                <p className="leading-relaxed">
                  We retain your account information and verification history for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="bg-white border border-[#ececec] rounded-[12px] px-6">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-semibold text-[#020202]">7. Cookies and Tracking</span>
              </AccordionTrigger>
              <AccordionContent className="text-[#5C5855] pb-4">
                <p className="leading-relaxed">
                  We use essential cookies for authentication and session management. We do not use tracking cookies or third-party analytics services.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="bg-white border border-[#ececec] rounded-[12px] px-6">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-semibold text-[#020202]">8. Children's Privacy</span>
              </AccordionTrigger>
              <AccordionContent className="text-[#5C5855] pb-4">
                <p className="leading-relaxed">
                  Our service is not intended for users under 13 years of age. We do not knowingly collect information from children under 13.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="bg-white border border-[#ececec] rounded-[12px] px-6">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-semibold text-[#020202]">9. Changes to This Policy</span>
              </AccordionTrigger>
              <AccordionContent className="text-[#5C5855] pb-4">
                <p className="leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Effective Date" above.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="bg-white border border-[#ececec] rounded-[12px] px-6">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-semibold text-[#020202]">10. Contact Us</span>
              </AccordionTrigger>
              <AccordionContent className="text-[#5C5855] pb-4">
                <p className="leading-relaxed">
                  If you have questions about this Privacy Policy or our data practices, please contact us at bittucreators@gmail.com.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
