'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '../../components/ui/button'
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

      {/* Privacy Policy Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 font-mono uppercase text-[#020202]">
            Privacy Policy
          </h1>
          
          <div className="mb-12">
            <p className="text-[#5C5855] mb-4 font-mono"><strong>EFFECTIVE DATE:</strong> NOVEMBER 22, 2025</p>
            <p className="text-[#5C5855] leading-relaxed font-mono">
              FKBounce ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our email verification service.
            </p>
          </div>

          <div className="space-y-12">
            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">1. INFORMATION WE COLLECT</h2>
              <div className="text-[#5C5855] space-y-3 font-mono">
                <p className="leading-relaxed">
                  <strong>ACCOUNT INFORMATION:</strong> When you sign in with Google OAuth, we collect your name, email address, and profile picture from your Google account.
                </p>
                <p className="leading-relaxed">
                  <strong>VERIFICATION DATA:</strong> Email addresses you submit for verification, verification results, and usage statistics. We store this information to provide analytics and maintain your verification history.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">2. HOW WE USE YOUR INFORMATION</h2>
              <div className="text-[#5C5855] font-mono">
                <ul className="list-disc list-inside space-y-2">
                  <li>To authenticate and manage your account</li>
                  <li>To provide email verification services</li>
                  <li>To generate analytics and usage reports</li>
                  <li>To enforce rate limits and prevent abuse</li>
                  <li>To improve our service and develop new features</li>
                  <li>To communicate important updates about our service</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">3. DATA STORAGE AND SECURITY</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  Your data is stored securely on Supabase (PostgreSQL) with encryption at rest and in transit. We implement industry-standard security measures including secure authentication tokens, API rate limiting, and regular security audits. Access to your data is restricted to authorized personnel only.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">4. DATA SHARING AND DISCLOSURE</h2>
              <div className="text-[#5C5855] space-y-3 font-mono">
                <p className="leading-relaxed">
                  We do not sell, rent, or share your personal information with third parties for their marketing purposes. We may share information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>With service providers who help us operate our service (e.g., hosting, authentication)</li>
                  <li>When required by law or to respond to legal process</li>
                  <li>To protect our rights, property, or safety, or that of our users</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">5. YOUR RIGHTS AND CHOICES</h2>
              <div className="text-[#5C5855] space-y-3 font-mono">
                <p className="leading-relaxed">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Access your personal data and verification history</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your account and associated data</li>
                  <li>Export your verification data</li>
                  <li>Opt out of non-essential communications</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">6. DATA RETENTION</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  We retain your account information and verification history for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">7. COOKIES AND TRACKING</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  We use essential cookies for authentication and session management. We do not use tracking cookies or third-party analytics services.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">8. CHILDREN'S PRIVACY</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  Our service is not intended for users under 13 years of age. We do not knowingly collect information from children under 13.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">9. CHANGES TO THIS POLICY</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Effective Date" above.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#020202] mb-4 font-mono uppercase">10. CONTACT US</h2>
              <div className="text-[#5C5855] font-mono">
                <p className="leading-relaxed">
                  If you have questions about this Privacy Policy or our data practices, please contact us at support@fkbounce.com.
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
