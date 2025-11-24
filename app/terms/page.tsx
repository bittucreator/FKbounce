'use client'

import Link from 'next/link'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/Logo-light.svg" alt="FKbounce" className="h-8 w-auto" />
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

      {/* Terms of Service Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 font-[family-name:var(--font-geist)] text-[#020202]">
            Terms of Service
          </h1>
          
          <Card>
            <CardContent className="p-8 space-y-6">
              <div>
                <p className="text-[#5C5855] mb-4"><strong>Effective Date:</strong> November 22, 2025</p>
                <p className="text-[#5C5855] leading-relaxed">
                  By accessing and using FKBounce, you agree to be bound by these Terms of Service. Please read them carefully.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">1. Service Description</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  FKBounce provides email verification services to help you validate email addresses for syntax, domain validity, MX records, and deliverability. Our service includes single email verification, bulk verification via CSV upload, RESTful API access, and analytics dashboard.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">2. User Accounts</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  You must sign in with a valid Google account to use our service. You are responsible for maintaining the security of your account and all activities that occur under your account. You must notify us immediately of any unauthorized use.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">3. Usage Limits and Fair Use</h2>
                <p className="text-[#5C5855] leading-relaxed mb-2">
                  <strong>Free Plan:</strong> 500 email verifications per month, API rate limit of 120 requests per minute
                </p>
                <p className="text-[#5C5855] leading-relaxed">
                  <strong>Pro Plan:</strong> 1,000,000 email verifications per month, API rate limit of 600 requests per minute
                </p>
                <p className="text-[#5C5855] leading-relaxed mt-3">
                  Excessive or abusive use that degrades service performance may result in rate limiting or account suspension.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">4. Acceptable Use Policy</h2>
                <p className="text-[#5C5855] leading-relaxed mb-2">You agree not to use FKBounce to:</p>
                <ul className="list-disc list-inside space-y-2 text-[#5C5855]">
                  <li>Send spam or unsolicited commercial emails</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt our service</li>
                  <li>Use the service for illegal activities</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">5. Payment and Billing</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  Pro plan subscriptions are billed monthly through our payment processor Dodo Payments. Payments are non-refundable except as required by law. We reserve the right to change pricing with 30 days notice.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">6. Service Availability</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  While we strive for 99.9% uptime, we do not guarantee uninterrupted service. We may perform scheduled maintenance and updates that may temporarily affect availability.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">7. Termination</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  We reserve the right to suspend or terminate your account at any time for violation of these Terms. You may cancel your account at any time through your account settings. Upon termination, your access to the service will cease immediately.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">8. Limitation of Liability</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  FKBounce is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, consequential, or punitive damages arising from your use of the service. Our total liability shall not exceed the amount you paid us in the past 12 months.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">9. Indemnification</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  You agree to indemnify and hold harmless FKBounce from any claims, damages, or expenses arising from your use of the service or violation of these Terms.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">10. Changes to Terms</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  We may modify these Terms at any time. Continued use of the service after changes constitutes acceptance of the modified Terms.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">11. Governing Law</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or your use of the service shall be resolved through binding arbitration.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3 text-[#020202]">12. Contact</h2>
                <p className="text-[#5C5855] leading-relaxed">
                  For questions about these Terms, contact us please contact us bittucreators@gmail.com.
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
              <Link href="/privacy" className="hover:text-[#020202] transition-colors font-mono">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[#020202] transition-colors font-mono font-semibold">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
