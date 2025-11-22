'use client'

import Link from 'next/link'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#eeeeee]">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/Logo-black.png" alt="FKbounce" className="h-8 w-auto" />
              <h1 className="text-xl font-[family-name:var(--font-geist)] text-[#020202]">
                FKBounce
              </h1>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Privacy Policy Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 font-[family-name:var(--font-geist)] text-[#020202]">
            Privacy Policy
          </h1>
          
          <Card>
            <CardContent className="p-8 space-y-6">
              <div>
                <p className="text-[#5C5855] mb-4"><strong>Effective Date:</strong> November 22, 2025</p>
                <p className="text-[#5C5855] leading-relaxed">
                  FKBounce ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our email verification service.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">1. Information We Collect</h2>
                <p className="text-[#5C5855] leading-relaxed mb-3">
                  <strong>Account Information:</strong> When you sign in with Google OAuth, we collect your name, email address, and profile picture from your Google account.
                </p>
                <p className="text-[#5C5855] leading-relaxed">
                  <strong>Verification Data:</strong> Email addresses you submit for verification, verification results, and usage statistics. We store this information to provide analytics and maintain your verification history.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">2. How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-2 text-[#5C5855]">
                  <li>To authenticate and manage your account</li>
                  <li>To provide email verification services</li>
                  <li>To generate analytics and usage reports</li>
                  <li>To enforce rate limits and prevent abuse</li>
                  <li>To improve our service and develop new features</li>
                  <li>To communicate important updates about our service</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">3. Data Storage and Security</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  Your data is stored securely on Supabase (PostgreSQL) with encryption at rest and in transit. We implement industry-standard security measures including secure authentication tokens, API rate limiting, and regular security audits. Access to your data is restricted to authorized personnel only.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">4. Data Sharing and Disclosure</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  We do not sell, rent, or share your personal information with third parties for their marketing purposes. We may share information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[#5C5855] mt-2">
                  <li>With service providers who help us operate our service (e.g., hosting, authentication)</li>
                  <li>When required by law or to respond to legal process</li>
                  <li>To protect our rights, property, or safety, or that of our users</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">5. Your Rights and Choices</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[#5C5855] mt-2">
                  <li>Access your personal data and verification history</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your account and associated data</li>
                  <li>Export your verification data</li>
                  <li>Opt out of non-essential communications</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">6. Data Retention</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  We retain your account information and verification history for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">7. Cookies and Tracking</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  We use essential cookies for authentication and session management. We do not use tracking cookies or third-party analytics services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">8. Children's Privacy</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  Our service is not intended for users under 13 years of age. We do not knowingly collect information from children under 13.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">9. Changes to This Policy</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Effective Date" above.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">10. Contact Us</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  If you have questions about this Privacy Policy or our data practices, please contact us bittucreators.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#5C5855]">
            <p className="font-mono">© 2025 FKBounce. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-[#020202] transition-colors font-mono font-semibold">
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
