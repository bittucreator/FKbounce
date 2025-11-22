'use client'

import Link from 'next/link'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Mail, Shield, Lock, BarChart3, Upload, CheckCircle2, Zap, Database, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#eeeeee]">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/Logo-black.png" alt="FKBounce" className="h-8 w-auto" />
              <h1 className="text-xl font-[family-name:var(--font-geist)] text-[#020202] font-bold">
                FKBounce
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-sm text-[#5C5855] hover:text-[#020202] transition-colors font-mono">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-[#5C5855] hover:text-[#020202] transition-colors font-mono">
                Terms
              </Link>
              <a href="https://fkbounce.vercel.app/" target="_blank" rel="noopener noreferrer">
                <Button>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <img src="/Logo-black.png" alt="FKBounce Logo" className="h-20 w-auto" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-[#020202] font-[family-name:var(--font-geist)]">
            Email Verification Made Simple
          </h1>
          <p className="text-xl text-[#5C5855] mb-8 leading-relaxed max-w-2xl mx-auto">
            FKBounce is a professional email verification service that helps you validate email addresses, 
            reduce bounce rates, and maintain a clean mailing list. Verify single emails or bulk lists instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://fkbounce.vercel.app/" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="w-full sm:w-auto">
                <Lock className="mr-2 h-5 w-5" />
                Sign In with Google
              </Button>
            </a>
            <Link href="#features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Brand Identity Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Shield className="h-16 w-16 mx-auto mb-6 text-[#020202]" />
            <h2 className="text-3xl font-bold mb-4 text-[#020202] font-[family-name:var(--font-geist)]">
              Trusted Email Verification Service
            </h2>
            <p className="text-lg text-[#5C5855] leading-relaxed">
              FKBounce is owned and operated as a dedicated email verification platform. 
              We are committed to providing accurate, fast, and secure email validation services 
              while maintaining the highest standards of data privacy and security.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-[#020202] font-[family-name:var(--font-geist)]">
            Powerful Features
          </h2>
          <p className="text-lg text-[#5C5855] max-w-2xl mx-auto">
            Everything you need to verify and validate email addresses at scale
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Single Verification */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-8 w-8 text-[#020202]" />
                <h3 className="text-xl font-semibold text-[#020202] font-mono">Single Verification</h3>
              </div>
              <p className="text-[#5C5855] leading-relaxed">
                Instantly verify individual email addresses with detailed validation results including 
                syntax checking, domain validation, MX record verification, and deliverability status.
              </p>
            </CardContent>
          </Card>

          {/* Bulk Verification */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-8 w-8 text-[#020202]" />
                <h3 className="text-xl font-semibold text-[#020202] font-mono">Bulk Verification</h3>
              </div>
              <p className="text-[#5C5855] leading-relaxed">
                Upload CSV files or paste up to 1,000,000 email addresses for batch processing. 
                Download comprehensive reports with validation results for your entire list.
              </p>
            </CardContent>
          </Card>

          {/* CSV Upload */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="h-8 w-8 text-[#020202]" />
                <h3 className="text-xl font-semibold text-[#020202] font-mono">CSV Upload</h3>
              </div>
              <p className="text-[#5C5855] leading-relaxed">
                Simple drag-and-drop interface for uploading CSV files. Process large email lists 
                quickly and efficiently with our optimized validation engine.
              </p>
            </CardContent>
          </Card>

          {/* API Access */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-8 w-8 text-[#020202]" />
                <h3 className="text-xl font-semibold text-[#020202] font-mono">RESTful API</h3>
              </div>
              <p className="text-[#5C5855] leading-relaxed">
                Integrate email verification directly into your applications with our robust REST API. 
                Includes comprehensive documentation and code examples.
              </p>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="h-8 w-8 text-[#020202]" />
                <h3 className="text-xl font-semibold text-[#020202] font-mono">Analytics Dashboard</h3>
              </div>
              <p className="text-[#5C5855] leading-relaxed">
                Track verification history, monitor usage statistics, and analyze email quality trends 
                over time with detailed charts and reports.
              </p>
            </CardContent>
          </Card>

          {/* Fast & Reliable */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="h-8 w-8 text-[#020202]" />
                <h3 className="text-xl font-semibold text-[#020202] font-mono">Fast & Reliable</h3>
              </div>
              <p className="text-[#5C5855] leading-relaxed">
                High-speed verification with 99.9% uptime. Our infrastructure is built for performance 
                and reliability to handle millions of verifications.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data Transparency Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-6 text-[#020202]" />
              <h2 className="text-3xl font-bold mb-4 text-[#020202] font-[family-name:var(--font-geist)]">
                Transparent Data Usage
              </h2>
              <p className="text-lg text-[#5C5855] leading-relaxed mb-8">
                We believe in complete transparency about how we collect and use your data.
              </p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-[#020202] mb-3 font-mono">What Data We Collect</h3>
                  <ul className="space-y-2 text-[#5C5855]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span><strong>Google Account Information:</strong> When you sign in with Google OAuth, we collect your name, email address, and profile picture for account authentication and identification.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span><strong>Email Addresses for Verification:</strong> The email addresses you submit through our service for validation purposes, along with verification results and timestamps.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span><strong>Usage Statistics:</strong> Verification counts, API usage metrics, and service interaction data to provide analytics and enforce usage limits.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-[#020202] mb-3 font-mono">Why We Request This Data</h3>
                  <ul className="space-y-2 text-[#5C5855]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span><strong>Authentication:</strong> To securely identify you and provide access to your verification dashboard and history.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span><strong>Service Delivery:</strong> To perform email verification services and store your verification history for future reference.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span><strong>Usage Tracking:</strong> To enforce fair usage limits (500 verifications/month for free, 1M/month for Pro), prevent abuse, and provide usage analytics.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span><strong>Service Improvement:</strong> To enhance our verification algorithms, improve user experience, and develop new features.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-[#020202] mb-3 font-mono">Your Data Rights</h3>
                  <p className="text-[#5C5855] leading-relaxed mb-3">
                    You have complete control over your data:
                  </p>
                  <ul className="space-y-2 text-[#5C5855]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>Access and download your verification history at any time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>Request deletion of your account and all associated data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>We do not sell or share your data with third parties for marketing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>All data is encrypted at rest and in transit using industry standards</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-[#020202] font-[family-name:var(--font-geist)]">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-[#5C5855] max-w-2xl mx-auto">
            Start for free, upgrade when you need more
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-2 text-[#020202] font-mono">Free</h3>
              <div className="text-4xl font-bold mb-6 text-[#020202]">$0<span className="text-xl text-[#5C5855]">/month</span></div>
              <ul className="space-y-3 mb-8 text-[#5C5855]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>500 verifications per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Single & bulk verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>CSV upload support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>API access (120 req/min)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Basic analytics dashboard</span>
                </li>
              </ul>
              <a href="https://fkbounce.vercel.app/" target="_blank" rel="noopener noreferrer">
                <Button className="w-full" variant="outline">
                  Get Started Free
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-2 border-[#020202]">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-[#020202] font-mono">Pro</h3>
                <span className="bg-[#020202] text-white text-xs px-3 py-1 rounded-full font-mono">POPULAR</span>
              </div>
              <div className="text-4xl font-bold mb-6 text-[#020202]">$29<span className="text-xl text-[#5C5855]">/month</span></div>
              <ul className="space-y-3 mb-8 text-[#5C5855]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span><strong>1,000,000 verifications/month</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Everything in Free plan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Priority API (600 req/min)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Advanced analytics & reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Priority email support</span>
                </li>
              </ul>
              <a href="https://fkbounce.vercel.app/" target="_blank" rel="noopener noreferrer">
                <Button className="w-full">
                  Upgrade to Pro
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#020202] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 font-[family-name:var(--font-geist)]">
            Ready to Clean Your Email List?
          </h2>
          <p className="text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
            Join thousands of users who trust FKBounce for accurate email verification
          </p>
          <a href="https://fkbounce.vercel.app/" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="secondary">
              <Lock className="mr-2 h-5 w-5" />
              Get Started with Google
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src="/Logo-black.png" alt="FKBounce" className="h-8 w-auto" />
              <span className="text-xl font-bold text-[#020202] font-[family-name:var(--font-geist)]">FKBounce</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#5C5855]">
              <a href="https://fkbounce.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-[#020202] transition-colors font-mono">
                App
              </a>
              <Link href="/privacy" className="hover:text-[#020202] transition-colors font-mono">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[#020202] transition-colors font-mono">
                Terms of Service
              </Link>
              <a href="mailto:bittucreators@gmail.com" className="hover:text-[#020202] transition-colors font-mono">
                Contact
              </a>
            </div>
            
            <p className="text-sm text-[#5C5855] font-mono">© 2025 FKBounce. All rights reserved.</p>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-[#5C5855]">
            <p>
              FKBounce is a professional email verification service. We are committed to protecting your privacy and securing your data.
              <br />
              Domain: <strong>fkbounce.vercel.app</strong> (deployed on Vercel)
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
