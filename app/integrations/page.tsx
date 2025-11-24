'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, ExternalLink } from 'lucide-react'
import AppBreadcrumb from '@/components/AppBreadcrumb'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface IntegrationConnection {
  connected: boolean
  account_name?: string
  account_email?: string
  [key: string]: any
}

function IntegrationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  // Zapier Connection
  const [zapierConnection, setZapierConnection] = useState<IntegrationConnection>({ connected: false })

  useEffect(() => {
    checkAuth()
    fetchAllConnections()
    
    // Check for OAuth success/error
    const integration = searchParams.get('integration')
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    
    if (success && integration) {
      setSuccessMessage(`Successfully connected to ${integration}!`)
      setShowSuccessAlert(true)
      fetchAllConnections()
      setTimeout(() => setShowSuccessAlert(false), 5000)
    }
    
    if (error) {
      alert(`Connection failed: ${error}`)
    }
  }, [searchParams])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
    }
  }

  const fetchAllConnections = async () => {
    try {
      // Fetch Zapier connection
      try {
        const zapierRes = await fetch('/api/integrations/zapier')
        if (zapierRes.ok) {
          const zapierData = await zapierRes.json()
          setZapierConnection(zapierData)
        }
      } catch (err) {
        console.error('Error fetching Zapier:', err)
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectIntegration = (integration: string) => {
    window.location.href = `/api/integrations/${integration}/connect`
  }

  const disconnectIntegration = async (integration: string, setter: (val: IntegrationConnection) => void) => {
    if (!confirm(`Are you sure you want to disconnect ${integration}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/integrations/${integration}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setter({ connected: false })
        alert(`${integration} disconnected successfully`)
      } else {
        alert(`Failed to disconnect ${integration}`)
      }
    } catch (error) {
      console.error(`Error disconnecting ${integration}:`, error)
      alert(`Failed to disconnect ${integration}`)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#eeeeee]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5C5855]" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#eeeeee]">
      <header className="border-b bg-[#eeeeee]">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/Logo-light.svg" alt="FKbounce" className="h-7 w-auto" />
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

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <svg className="h-8 w-8 text-[#020202]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
            <h1 className="text-3xl font-bold text-[#020202] font-[family-name:var(--font-geist)]">
              Integrations
            </h1>
          </div>
          <p className="text-[#5C5855] text-sm font-mono">
            Connect FKbounce with your favorite tools and services
          </p>
        </div>

        {/* Success Alert */}
        {showSuccessAlert && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage || 'Successfully connected!'}
            </AlertDescription>
          </Alert>
        )}

        {/* Zapier Integration */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/zapier.jpeg" alt="Zapier" className="h-10 w-10 rounded" />
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Zapier
                    {zapierConnection.connected && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Connect to 7000+ apps including HubSpot, Salesforce, Google Sheets, Airtable, and more
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!zapierConnection.connected ? (
              <>
                <Alert>
                  <AlertDescription>
                    Use Zapier to connect FKbounce with thousands of apps. Automate email verification workflows, 
                    sync with CRMs, update spreadsheets, and more - all without code.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Popular Workflows:</h4>
                  <ul className="list-disc list-inside text-sm text-[#5C5855] space-y-1">
                    <li>Verify emails from Google Sheets → Update status automatically</li>
                    <li>New HubSpot contact → Verify email → Update contact</li>
                    <li>Salesforce lead → Verify email → Qualify lead</li>
                    <li>Bulk job completed → Send Slack notification</li>
                    <li>Typeform submission → Verify email → Add to CRM</li>
                  </ul>
                </div>
                <Button onClick={() => window.open('https://zapier.com', '_blank')} className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Set Up Zapier Integration
                </Button>
                <p className="text-xs text-[#5C5855] text-center">
                  Get your API key from the API Keys page to connect with Zapier
                </p>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-semibold text-sm">Zapier Connected</p>
                      <p className="text-xs text-[#5C5855]">Using API key authentication</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>

                  <Alert>
                    <AlertDescription className="text-xs">
                      <strong>Available Triggers:</strong> Email Verified, Bulk Job Completed<br/>
                      <strong>Available Actions:</strong> Verify Single Email, Verify Multiple Emails
                    </AlertDescription>
                  </Alert>
                </div>

                <Button onClick={() => disconnectIntegration('zapier', setZapierConnection)} variant="destructive" className="w-full">
                  Disconnect Zapier
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[#eeeeee]">
        <div className="animate-pulse text-[#5C5855] font-mono">Loading...</div>
      </main>
    }>
      <IntegrationsContent />
    </Suspense>
  )
}
