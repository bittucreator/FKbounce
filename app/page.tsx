'use client'

import { useState } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Zap, Shield, BarChart3, ArrowRight, Sparkles, Webhook, Check } from 'lucide-react'
import { Terminal, TypingAnimation, AnimatedSpan } from '@/components/ui/terminal'
import { HyperText } from '@/components/ui/hyper-text'
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

type FeatureKey = 'realtime' | 'bulk' | 'analytics' | 'webhook' | 'security' | 'lists'

export default function LandingPage() {
  const router = useRouter()
  const [selectedFeature, setSelectedFeature] = useState<FeatureKey>('realtime')

  const features = [
    {
      key: 'realtime' as FeatureKey,
      icon: <Zap className="h-5 w-5" />,
      title: 'Real-time Verification',
      color: 'yellow',
      description: 'Instant SMTP validation with catch-all detection'
    },
    {
      key: 'bulk' as FeatureKey,
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: 'Bulk Verification',
      color: 'purple',
      description: 'Process millions of emails at scale'
    },
    {
      key: 'analytics' as FeatureKey,
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Smart Analytics',
      color: 'green',
      description: 'Track metrics and list quality in real-time'
    },
    {
      key: 'webhook' as FeatureKey,
      icon: <Webhook className="h-5 w-5" />,
      title: 'Webhook Integration',
      color: 'pink',
      description: 'Get real-time notifications for bulk jobs'
    },
    {
      key: 'security' as FeatureKey,
      icon: <Shield className="h-5 w-5" />,
      title: 'Enterprise Security',
      color: 'blue',
      description: 'Bank-level encryption and compliance'
    },
    {
      key: 'lists' as FeatureKey,
      icon: <Sparkles className="h-5 w-5" />,
      title: 'Smart Lists & Export',
      color: 'indigo',
      description: 'Organize and export with ease'
    }
  ]

  const featureContent = {
    realtime: (
      <Terminal className="w-full max-w-none">
        <TypingAnimation duration={40}>$ curl -X POST https://api.fkbounce.com/verify \</TypingAnimation>
        <AnimatedSpan>  -H &quot;Authorization: Bearer YOUR_API_KEY&quot; \</AnimatedSpan>
        <AnimatedSpan>  -d &apos;{`{"email": "user@example.com"}`}&apos;</AnimatedSpan>
        <AnimatedSpan className="text-gray-500"> </AnimatedSpan>
        <AnimatedSpan className="text-green-400">{`{`}</AnimatedSpan>
        <AnimatedSpan className="text-green-400">  &quot;status&quot;: &quot;valid&quot;,</AnimatedSpan>
        <AnimatedSpan className="text-green-400">  &quot;score&quot;: 98,</AnimatedSpan>
        <AnimatedSpan className="text-green-400">  &quot;deliverable&quot;: true,</AnimatedSpan>
        <AnimatedSpan className="text-green-400">  &quot;catch_all&quot;: false,</AnimatedSpan>
        <AnimatedSpan className="text-green-400">  &quot;time&quot;: &quot;1.2s&quot;</AnimatedSpan>
        <AnimatedSpan className="text-green-400">{`}`}</AnimatedSpan>
      </Terminal>
    ),
    bulk: (
      <Terminal className="w-full max-w-none">
        <TypingAnimation duration={40}>$ curl -X POST https://api.fkbounce.com/bulk \</TypingAnimation>
        <AnimatedSpan>  -F &quot;file=@emails.csv&quot; \</AnimatedSpan>
        <AnimatedSpan>  -H &quot;Authorization: Upload your CSV file&quot;</AnimatedSpan>
        <AnimatedSpan className="text-gray-500"> </AnimatedSpan>
        <AnimatedSpan className="text-blue-400">{`{`}</AnimatedSpan>
        <AnimatedSpan className="text-blue-400">  &quot;job_id&quot;: &quot;bulk_xyz123&quot;,</AnimatedSpan>
        <AnimatedSpan className="text-blue-400">  &quot;total_emails&quot;: 50000,</AnimatedSpan>
        <AnimatedSpan className="text-blue-400">  &quot;status&quot;: &quot;processing&quot;,</AnimatedSpan>
        <AnimatedSpan className="text-blue-400">  &quot;eta&quot;: &quot;~5 minutes&quot;</AnimatedSpan>
        <AnimatedSpan className="text-blue-400">{`}`}</AnimatedSpan>
      </Terminal>
    ),
    analytics: (
      <Terminal className="w-full max-w-none">
        <TypingAnimation duration={40}>$ curl https://api.fkbounce.com/analytics \</TypingAnimation>
        <AnimatedSpan>  -H &quot;Authorization: Real-time analytics&quot;</AnimatedSpan>
        <AnimatedSpan className="text-gray-500"> </AnimatedSpan>
        <AnimatedSpan className="text-cyan-400">{`{`}</AnimatedSpan>
        <AnimatedSpan className="text-cyan-400">  &quot;valid&quot;: 45230,</AnimatedSpan>
        <AnimatedSpan className="text-cyan-400">  &quot;invalid&quot;: 3210,</AnimatedSpan>
        <AnimatedSpan className="text-cyan-400">  &quot;catch_all&quot;: 1560,</AnimatedSpan>
        <AnimatedSpan className="text-cyan-400">  &quot;quality_score&quot;: 94.8</AnimatedSpan>
        <AnimatedSpan className="text-cyan-400">{`}`}</AnimatedSpan>
      </Terminal>
    ),
    webhook: (
      <Terminal className="w-full max-w-none">
        <TypingAnimation duration={40}># Webhook payload received at your endpoint</TypingAnimation>
        <AnimatedSpan className="text-gray-500"> </AnimatedSpan>
        <AnimatedSpan className="text-purple-400">{`{`}</AnimatedSpan>
        <AnimatedSpan className="text-purple-400">  &quot;event&quot;: &quot;bulk.completed&quot;,</AnimatedSpan>
        <AnimatedSpan className="text-purple-400">  &quot;job_id&quot;: &quot;bulk_xyz123&quot;,</AnimatedSpan>
        <AnimatedSpan className="text-purple-400">  &quot;valid&quot;: 48500,</AnimatedSpan>
        <AnimatedSpan className="text-purple-400">  &quot;invalid&quot;: 1500,</AnimatedSpan>
        <AnimatedSpan className="text-purple-400">  &quot;download_url&quot;: &quot;https://...&quot;</AnimatedSpan>
        <AnimatedSpan className="text-purple-400">{`}`}</AnimatedSpan>
      </Terminal>
    ),
    security: (
      <div className="space-y-4">
        <Terminal className="w-full max-w-none">
          <TypingAnimation duration={40}>$ curl https://api.fkbounce.com/security \</TypingAnimation>
          <AnimatedSpan>  -H &quot;Authorization: Powerful security&quot;</AnimatedSpan>
          <AnimatedSpan className="text-gray-500"> </AnimatedSpan>
          <AnimatedSpan className="text-blue-400">{`{`}</AnimatedSpan>
          <AnimatedSpan className="text-blue-400">  &quot;encryption&quot;: &quot;AES-256&quot;,</AnimatedSpan>
          <AnimatedSpan className="text-blue-400">  &quot;compliance&quot;: [</AnimatedSpan>
          <AnimatedSpan className="text-blue-400">    &quot;GDPR&quot;, &quot;SOC 2&quot;, &quot;ISO 27001&quot;</AnimatedSpan>
          <AnimatedSpan className="text-blue-400">  ],</AnimatedSpan>
          <AnimatedSpan className="text-blue-400">  &quot;data_retention&quot;: &quot;30 days&quot;,</AnimatedSpan>
          <AnimatedSpan className="text-blue-400">  &quot;ssl_grade&quot;: &quot;A+&quot;</AnimatedSpan>
          <AnimatedSpan className="text-blue-400">{`}`}</AnimatedSpan>
        </Terminal>
      </div>
    ),
    lists: (
      <div className="space-y-4">
        <Terminal className="w-full max-w-none">
          <TypingAnimation duration={40}>$ curl https://api.fkbounce.com/lists/export \</TypingAnimation>
          <AnimatedSpan>  -H &quot;Export: CSV, Excel,XLML&quot; \</AnimatedSpan>
          <AnimatedSpan>  -d &apos;{`{"list_id": "list_abc", "format": "csv"}`}&apos;</AnimatedSpan>
          <AnimatedSpan className="text-gray-500"> </AnimatedSpan>
          <AnimatedSpan className="text-indigo-400">{`{`}</AnimatedSpan>
          <AnimatedSpan className="text-indigo-400">  &quot;export_id&quot;: &quot;exp_xyz789&quot;,</AnimatedSpan>
          <AnimatedSpan className="text-indigo-400">  &quot;total_emails&quot;: 12500,</AnimatedSpan>
          <AnimatedSpan className="text-indigo-400">  &quot;format&quot;: &quot;csv&quot;,</AnimatedSpan>
          <AnimatedSpan className="text-indigo-400">  &quot;download_url&quot;: &quot;https://...&quot;</AnimatedSpan>
          <AnimatedSpan className="text-indigo-400">{`}`}</AnimatedSpan>
        </Terminal>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-gray-50 to-gray-100">

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 bg-[#fafafa]/95 backdrop-blur-md border-b border-gray-200/50 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <img src="/Logo-dark.svg" alt="FKbounce" className="h-8 w-auto" />
              </div>
              <nav className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-xs font-mono font-medium text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wide">
                  Features
                </a>
                <a href="#pricing" className="text-xs font-mono font-medium text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wide">
                  Pricing
                </a>
                <a href="/compare" className="text-xs font-mono font-medium text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wide">
                  Compare
                </a>
                <a href="/contact" className="text-xs font-mono font-medium text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wide">
                  Contact
                </a>
              </nav>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/login')}
                  className="h-[24px] px-3 rounded-[4px] text-[12px] font-mono uppercase tracking-wide text-black border-black hover:bg-black hover:text-white transition-colors"
                >
                  SIGN UP
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-[#fafafa]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f4f4f4] rounded-full mb-8">
                <AnimatedShinyText className="text-xs font-mono font-semibold text-primary uppercase tracking-wide">
                  Turn bounces into conversions
                </AnimatedShinyText>
              </div>

              <h1 
                className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
              >
                Verify Emails at
                <br />
                <span className="bg-gradient-to-r from-primary via-gray-800 to-primary bg-clip-text text-transparent">
                  Lightning Speed
                </span>
              </h1>

              <p className="text-sm font-mono text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed uppercase tracking-wide">
                Real-time email verification with 99.5% accuracy. Clean your lists, 
                boost deliverability, and protect your sender reputation.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <RainbowButton
                  onClick={() => router.push('/login')}
                  className="h-[30px] px-3 rounded-[4px] text-[12px] font-mono uppercase tracking-wide"
                >
                  Start Free
                  <ArrowRight className="ml-2 h-3 w-3" />
                </RainbowButton>
                <Button
                  variant="outline"
                  onClick={() => router.push('/compare')}
                  className="h-[28px] px-3 rounded-[4px] text-[12px] font-mono uppercase tracking-wide text-black border-black hover:bg-black hover:text-white transition-colors"
                >
                  See Comparison
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-mono uppercase tracking-wide">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-mono uppercase tracking-wide">500 free verifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-mono uppercase tracking-wide">Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#fafafa]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything you need to verify emails
              </h2>
              <p className="text-sm font-mono text-gray-600 max-w-2xl mx-auto mb-8 uppercase tracking-wide">
                Powerful features that make email verification simple and effective
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
                {features.map((feature) => {
                  const isActive = selectedFeature === feature.key
                  
                  return (
                    <button
                      key={feature.key}
                      onClick={() => setSelectedFeature(feature.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wide transition-all duration-300 ${
                        isActive 
                          ? 'bg-primary text-white shadow-sm scale-105' 
                          : 'bg-white text-gray-700 border border-gray-200 hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      <span className={`${isActive ? 'text-white' : 'text-primary'} [&>svg]:h-3.5 [&>svg]:w-3.5`}>
                        {feature.icon}
                      </span>
                      <span className="whitespace-nowrap">{feature.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected Feature Display */}
            <div className="max-w-4xl mx-auto px-4">
              <div key={selectedFeature} className="animate-in fade-in duration-500">
                {featureContent[selectedFeature]}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#fafafa]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Trusted by thousands of businesses
              </h2>
              <p className="text-sm font-mono uppercase tracking-wide text-gray-600">Real numbers, real impact</p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { number: '99.5%', label: 'Accuracy Rate' },
                { number: '10M+', label: 'Emails Verified' },
                { number: '< 2s', label: 'Average Speed' },
                { number: '24/7', label: 'Support Available' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <HyperText
                    className="text-5xl font-bold text-primary mb-3"
                    duration={1000}
                    animateOnHover={true}
                  >
                    {stat.number}
                  </HyperText>
                  <div className="text-gray-600 font-medium text-base">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Free Forever Section */}
        <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#fafafa]">
          <div className="max-w-4xl mx-auto">
            <Card className="relative border-2 border-primary shadow-lg overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
              <CardContent className="p-8 md:p-12">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <Badge className="bg-green-500 text-white px-3 py-1 text-sm font-semibold">
                      🎉 100% Free Forever
                    </Badge>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    No Limits. No Credit Card. No Catch.
                  </h2>
                  
                  <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                    We believe email verification should be accessible to everyone. 
                    Enjoy all features completely free, forever.
                  </p>

                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-sm text-gray-700">Unlimited verifications</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-sm text-gray-700">Single & bulk verification</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-sm text-gray-700">Full SMTP verification</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-sm text-gray-700">CSV/Excel/JSON export</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-sm text-gray-700">API access included</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-sm text-gray-700">Unlimited history</span>
                    </div>
                  </div>

                  <RainbowButton 
                    className="h-12 px-8 rounded-lg text-sm font-semibold"
                    onClick={() => router.push('/login')}
                  >
                    Start Verifying for Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </RainbowButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#fafafa]">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                Everything you need to know about email verification
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  How does email verification work?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Our system performs real-time SMTP validation by connecting to mail servers and verifying if an email address can receive messages. We check syntax, domain validity, MX records, and mailbox existence without sending actual emails.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  What's included in the free trial?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  You get 500 free verification credits monthly with no credit card required. This includes access to all features: real-time verification, bulk processing, API access, webhooks, and detailed analytics dashboard.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  How accurate is the verification?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  We maintain 99.5% accuracy by using multiple validation layers including syntax checks, DNS validation, SMTP verification, and catch-all detection. Our system is constantly updated to handle edge cases and new email providers.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">
                  Can I verify emails in bulk?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Yes! Upload CSV files with up to 100,000 emails at once. Our system processes them asynchronously with real-time progress tracking. You'll receive detailed reports with verification results, bounce reasons, and quality scores.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left">
                  Is my data secure?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Absolutely. We use AES-256 encryption for data at rest and TLS 1.3 for data in transit. We're GDPR compliant, SOC 2 certified, and never store or share your email lists. All data is automatically deleted after 30 days.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger className="text-left">
                  Do you offer API access?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Yes! Our RESTful API is available on all plans. Get real-time verification responses in under 2 seconds with comprehensive documentation, SDKs for popular languages, webhook support, and 99.9% uptime SLA.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#fafafa]">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="border-0 shadow-none overflow-hidden">
              <CardContent className="p-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Ready to clean your email list?
                </h2>
                <p className="text-sm font-mono text-gray-600 mb-8 uppercase tracking-wide">
                  Start verifying emails today with 500 free emails/month. No credit card required.
                </p>
                <RainbowButton
                  onClick={() => router.push('/login')}
                  className="h-[34px] px-3 rounded-[8px] text-[12px] font-mono uppercase tracking-wide"
                >
                  Start Free
                  <ArrowRight className="ml-2 h-3 w-3" />
                </RainbowButton>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-8">
                <img src="/Logo-dark.svg" alt="FKbounce" className="h-7 w-auto" />
                <div className="flex items-center gap-6 text-xs text-gray-600">
                  <a href="/compare" className="font-mono uppercase tracking-wide hover:text-gray-900 transition-colors">
                    Compare
                  </a>
                  <a href="/privacy" className="font-mono uppercase tracking-wide hover:text-gray-900 transition-colors">
                    Privacy
                  </a>
                  <a href="/terms" className="font-mono uppercase tracking-wide hover:text-gray-900 transition-colors">
                    Terms
                  </a>
                </div>
              </div>
              <p className="text-sm text-gray-600 font-mono">
                © 2025 FKbounce. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
