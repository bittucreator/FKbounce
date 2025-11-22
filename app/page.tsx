'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'
import { User } from '@supabase/supabase-js'
import EmailVerifier from '../components/EmailVerifier'
import BulkVerifier from '../components/BulkVerifier'
import AppBreadcrumb from '../components/AppBreadcrumb'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Mail, Shield, Lock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) {
      console.error('Error signing in:', error.message)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#eeeeee]">
        <div className="animate-pulse text-[#5C5855] font-mono">Loading...</div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#eeeeee] relative px-4 overflow-hidden">
        {/* Desktop floating feature cards - scattered asymmetrically */}
        {/* Top Left */}
        <div className="hidden xl:block absolute left-12 top-20 w-80 z-10">
          <div className="bg-white shadow-lg p-6 border border-[#ececec] h-[140px] rotate-[-2deg]">
            <div className="flex items-center gap-3 mb-3">
              <img src="/Mail.svg" alt="Single" className="h-7 w-7" />
              <span className="font-mono text-lg font-semibold text-[#020202]">Single Verification</span>
            </div>
            <p className="text-sm text-[#5C5855] leading-relaxed">Instantly check if an email address is valid, disposable, or risky.</p>
          </div>
        </div>
        
        {/* Top Right */}
        <div className="hidden xl:block absolute right-16 top-32 w-80 z-10">
          <div className="bg-white shadow-lg p-6 border border-[#ececec] h-[140px] rotate-[3deg]">
            <div className="flex items-center gap-3 mb-3">
              <img src="/pro.svg" alt="Pro" className="h-7 w-7" />
              <span className="font-mono text-lg font-semibold text-[#020202]">Pro Plan</span>
            </div>
            <p className="text-sm text-[#5C5855] leading-relaxed">1,000,000 verifications/month, priority support, and more.</p>
          </div>
        </div>
        
        {/* Left Middle */}
        <div className="hidden xl:block absolute left-8 top-1/2 -translate-y-1/2 w-80 z-10">
          <div className="bg-white shadow-lg p-6 border border-[#ececec] h-[140px] rotate-[1deg]">
            <div className="flex items-center gap-3 mb-3">
              <img src="/bulk emails.svg" alt="Bulk" className="h-7 w-7" />
              <span className="font-mono text-lg font-semibold text-[#020202]">Bulk Verification</span>
            </div>
            <p className="text-sm text-[#5C5855] leading-relaxed">Upload a CSV or paste up to 1,000,000 emails for fast batch validation.</p>
          </div>
        </div>
        
        {/* Right Middle */}
        <div className="hidden xl:block absolute right-12 top-1/2 translate-y-12 w-80 z-10">
          <div className="bg-white shadow-lg p-6 border border-[#ececec] h-[140px] rotate-[-1deg]">
            <div className="flex items-center gap-3 mb-3">
              <img src="/csv-upload.svg" alt="CSV" className="h-7 w-7" />
              <span className="font-mono text-lg font-semibold text-[#020202]">CSV Upload</span>
            </div>
            <p className="text-sm text-[#5C5855] leading-relaxed">Drag & drop your CSV file for instant bulk email checks.</p>
          </div>
        </div>
        
        {/* Bottom Left */}
        <div className="hidden xl:block absolute left-20 bottom-24 w-80 z-10">
          <div className="bg-white shadow-lg p-6 border border-[#ececec] h-[140px] rotate-[2deg]">
            <div className="flex items-center gap-3 mb-3">
              <img src="/graph.svg" alt="Analytics" className="h-7 w-7" />
              <span className="font-mono text-lg font-semibold text-[#020202]">Analytics</span>
            </div>
            <p className="text-sm text-[#5C5855] leading-relaxed">Track your verification history, usage stats, and monitor email quality trends.</p>
          </div>
        </div>
        
        {/* Bottom Right */}
        <div className="hidden xl:block absolute right-20 bottom-32 w-80 z-10">
          <div className="bg-white shadow-lg p-6 border border-[#ececec] h-[140px] rotate-[-3deg]">
            <div className="flex items-center gap-3 mb-3">
              <img src="/lock.svg" alt="API" className="h-7 w-7" />
              <span className="font-mono text-lg font-semibold text-[#020202]">API Access</span>
            </div>
            <p className="text-sm text-[#5C5855] leading-relaxed">Integrate email verification into your apps with our RESTful API.</p>
          </div>
        </div>
        
        {/* Mobile feature cards - Top */}
        <div className="xl:hidden w-full max-w-sm mb-8 z-10">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white shadow-lg p-4 border border-[#ececec]">
              <div className="flex items-start gap-3">
                <img src="/Mail.svg" alt="Single" className="h-6 w-6 mt-1" />
                <div className="text-left">
                  <span className="font-mono text-sm font-semibold text-[#020202] block mb-1">Single Verification</span>
                  <p className="text-xs text-[#5C5855] leading-relaxed">Instantly check if an email address is valid, disposable, or risky.</p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg p-4 border border-[#ececec]">
              <div className="flex items-start gap-3">
                <img src="/bulk emails.svg" alt="Bulk" className="h-6 w-6 mt-1" />
                <div className="text-left">
                  <span className="font-mono text-sm font-semibold text-[#020202] block mb-1">Bulk Verification</span>
                  <p className="text-xs text-[#5C5855] leading-relaxed">Upload a CSV or paste up to 1,000,000 emails for fast batch validation.</p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg p-4 border border-[#ececec]">
              <div className="flex items-start gap-3">
                <img src="/graph.svg" alt="Analytics" className="h-6 w-6 mt-1" />
                <div className="text-left">
                  <span className="font-mono text-sm font-semibold text-[#020202] block mb-1">Analytics</span>
                  <p className="text-xs text-[#5C5855] leading-relaxed">Track your verification history, usage stats, and monitor email quality trends.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sign-in card */}
        <Card className="w-full h-full align-middle max-w-md mx-auto h-[350px] z-20 mb-8 xl:mb-0 flex flex-col items-center justify-center">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/Logo-black.png" alt="FKbounce" className="h-12 w-auto" />
            </div>
            <CardTitle className="text-3xl font-[family-name:var(--font-geist)] text-[#020202]">
              FKbounce
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSignIn} 
              className="w-full items-center justify-center flex gap-2"
            >
              <Lock className="h-5 w-5" /> Sign in with Google
            </Button>
            <p className="text-center text-xs text-[#5C5855] font-mono">
              Sign in to start verifying email addresses.
            </p>
          </CardContent>
        </Card>
        
        {/* Mobile feature cards - Bottom */}
        <div className="xl:hidden w-full max-w-sm mt-8 z-10">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white shadow-lg p-4 border border-[#ececec]">
              <div className="flex items-start gap-3">
                <img src="/pro.svg" alt="Pro" className="h-6 w-6 mt-1" />
                <div className="text-left">
                  <span className="font-mono text-sm font-semibold text-[#020202] block mb-1">Pro Plan</span>
                  <p className="text-xs text-[#5C5855] leading-relaxed">Upgrade for 1,000,000 verifications/month, priority support, and more.</p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg p-4 border border-[#ececec]">
              <div className="flex items-start gap-3">
                <img src="/csv-upload.svg" alt="CSV" className="h-6 w-6 mt-1" />
                <div className="text-left">
                  <span className="font-mono text-sm font-semibold text-[#020202] block mb-1">CSV Upload</span>
                  <p className="text-xs text-[#5C5855] leading-relaxed">Drag & drop your CSV file for instant bulk email checks.</p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg p-4 border border-[#ececec]">
              <div className="flex items-start gap-3">
                <img src="/lock.svg" alt="API" className="h-6 w-6 mt-1" />
                <div className="text-left">
                  <span className="font-mono text-sm font-semibold text-[#020202] block mb-1">API Access</span>
                  <p className="text-xs text-[#5C5855] leading-relaxed">Integrate email verification into your apps with our RESTful API.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="absolute bottom-0 left-0 right-0 w-full py-2 px-4 border-t border-[#ececec] bg-white z-10">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-[#5C5855]">
            <p className="font-mono">© 2025 FKBounce</p>
            <div className="flex items-center gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:text-[#020202] transition-colors font-mono">Privacy</button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-[family-name:var(--font-geist)]">Privacy Policy</DialogTitle>
                    <DialogDescription className="text-left space-y-4 pt-4">
                      <p><strong>Effective Date:</strong> November 22, 2025</p>
                      
                      <div>
                        <h3 className="font-semibold text-[#020202] mb-2">1. Information We Collect</h3>
                        <p>We collect email addresses you submit for verification, along with your account information when you sign in with Google.</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-[#020202] mb-2">2. How We Use Your Information</h3>
                        <p>We use your information to provide email verification services, maintain your account, and improve our platform.</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-[#020202] mb-2">3. Data Storage and Security</h3>
                        <p>Your data is securely stored and encrypted. We implement industry-standard security measures to protect your information.</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-[#020202] mb-2">4. Data Sharing</h3>
                        <p>We do not sell or share your personal information with third parties except as necessary to provide our services.</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-[#020202] mb-2">5. Your Rights</h3>
                        <p>You have the right to access, modify, or delete your personal data at any time.</p>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <button className="hover:text-[#020202] transition-colors font-mono">Terms</button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-[family-name:var(--font-geist)]">Terms of Service</DialogTitle>
                    <DialogDescription className="text-left space-y-4 pt-4">
                      <p><strong>Effective Date:</strong> November 22, 2025</p>
                      
                      <div>
                        <h3 className="font-semibold text-[#020202] mb-2">1. Acceptance of Terms</h3>
                        <p>By accessing and using FKBounce, you agree to be bound by these Terms of Service.</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-[#020202] mb-2">2. Service Description</h3>
                        <p>FKBounce provides email verification services to help you validate email addresses for quality and deliverability.</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-[#020202] mb-2">3. Usage Limits</h3>
                        <p>Free users receive 500 verifications per month. Pro users receive 1,000,000 verifications per month. API rate limits apply as specified in your plan.</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-[#020202] mb-2">4. Acceptable Use</h3>
                        <p>You agree not to use FKBounce for spam, illegal activities, or to violate any applicable laws and regulations.</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-[#020202] mb-2">5. Account Termination</h3>
                        <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in abusive behavior.</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-[#020202] mb-2">6. Limitation of Liability</h3>
                        <p>FKBounce is provided "as is" without warranties. We are not liable for any damages arising from your use of the service.</p>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </footer>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b bg-[#eeeeee]">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/Logo-black.png" alt="FKbounce" className="h-7 w-auto" />
              <h1 className="text-[1.2rem] font-[family-name:var(--font-geist)] text-[#020202]">
                FKbounce
              </h1>
            </button>
            <div className="ml-1">
              <AppBreadcrumb />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-10">
        <Tabs defaultValue="single" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-fit max-w-xs mx-auto rounded-[8px]">
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
      
      {/* Footer */}
      <footer className="w-full py-6 px-4 border-t border-[#ececec] bg-white mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#5C5855]">
          <p className="font-mono">© 2025 FKBounce</p>
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <button className="hover:text-[#020202] transition-colors font-mono">Privacy Policy</button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-[family-name:var(--font-geist)]">Privacy Policy</DialogTitle>
                  <DialogDescription className="text-left space-y-4 pt-4">
                    <p><strong>Effective Date:</strong> November 22, 2025</p>
                    
                    <div>
                      <h3 className="font-semibold text-[#020202] mb-2">1. Information We Collect</h3>
                      <p>We collect email addresses you submit for verification, along with your account information when you sign in with Google.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-[#020202] mb-2">2. How We Use Your Information</h3>
                      <p>We use your information to provide email verification services, maintain your account, and improve our platform.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-[#020202] mb-2">3. Data Storage and Security</h3>
                      <p>Your data is securely stored and encrypted. We implement industry-standard security measures to protect your information.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-[#020202] mb-2">4. Data Sharing</h3>
                      <p>We do not sell or share your personal information with third parties except as necessary to provide our services.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-[#020202] mb-2">5. Your Rights</h3>
                      <p>You have the right to access, modify, or delete your personal data at any time.</p>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <button className="hover:text-[#020202] transition-colors font-mono">Terms of Service</button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-[family-name:var(--font-geist)]">Terms of Service</DialogTitle>
                  <DialogDescription className="text-left space-y-4 pt-4">
                    <p><strong>Effective Date:</strong> November 22, 2025</p>
                    
                    <div>
                      <h3 className="font-semibold text-[#020202] mb-2">1. Acceptance of Terms</h3>
                      <p>By accessing and using FKBounce, you agree to be bound by these Terms of Service.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-[#020202] mb-2">2. Service Description</h3>
                      <p>FKBounce provides email verification services to help you validate email addresses for quality and deliverability.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-[#020202] mb-2">3. Usage Limits</h3>
                      <p>Free users receive 500 verifications per month. Pro users receive 1,000,000 verifications per month. API rate limits apply as specified in your plan.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-[#020202] mb-2">4. Acceptable Use</h3>
                      <p>You agree not to use FKBounce for spam, illegal activities, or to violate any applicable laws and regulations.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-[#020202] mb-2">5. Account Termination</h3>
                      <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in abusive behavior.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-[#020202] mb-2">6. Limitation of Liability</h3>
                      <p>FKBounce is provided "as is" without warranties. We are not liable for any damages arising from your use of the service.</p>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </footer>
    </main>
  )
}
