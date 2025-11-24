'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RainbowButton } from '@/components/ui/rainbow-button'

export default function ContactPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // TODO: Implement actual form submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSubmitting(false)
    setSubmitSuccess(true)
    setFormData({ name: '', email: '', subject: '', message: '' })

    // Reset success message after 5 seconds
    setTimeout(() => setSubmitSuccess(false), 5000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#fafafa]/95 backdrop-blur-md border-b border-gray-200/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="/Logo-dark.svg" alt="FKbounce" className="h-8 w-auto" />
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="/#features" className="text-xs font-mono font-medium text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wide">
                Features
              </a>
              <a href="/#pricing" className="text-xs font-mono font-medium text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wide">
                Pricing
              </a>
              <a href="/compare" className="text-xs font-mono font-medium text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wide">
                Compare
              </a>
              <a href="/contact" className="text-xs font-mono font-medium text-gray-900 transition-colors uppercase tracking-wide">
                Contact
              </a>
            </nav>
            <div className="flex items-center gap-6">
              <Button
                variant="outline"
                onClick={() => router.push('/login')}
                className="h-[24px] px-3 rounded-[4px] text-[12px] font-mono uppercase tracking-wide text-black border-black hover:bg-black hover:text-white transition-colors"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h1>
            <p className="text-sm font-mono text-gray-600 max-w-2xl mx-auto uppercase tracking-wide">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Contact Form */}
            <Card className="border-1">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                
                {submitSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm font-medium">
                      ✓ Message sent successfully! We'll get back to you soon.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-xs font-mono font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="YOUR NAME"
                      className="w-full font-mono placeholder:uppercase text-[12px]"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-mono font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Email *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="YOUR@EMAIL.COM"
                      className="w-full font-mono placeholder:uppercase text-[12px]"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-xs font-mono font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Subject *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="WHAT'S THIS ABOUT?"
                      className="w-full font-mono placeholder:uppercase text-[12px]"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-mono font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="TELL US MORE..."
                      rows={6}
                      className="w-full resize-none font-mono placeholder:uppercase text-[12px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-[34px] rounded-[4px] text-[12px] font-mono uppercase tracking-wide"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200 bg-white">
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
  )
}
