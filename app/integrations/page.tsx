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
      <main className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5C5855]" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <header className="border-b-[0.5px] bg-[#fafafa]">
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

        {/* Zapier Integration - Hidden for now */}
        {/* <Card className="mb-6">
          ... Zapier integration card ...
        </Card> */}

        {/* Coming Soon Section */}
        <Card>
          <CardHeader>
            <CardTitle>More Integrations Coming Soon</CardTitle>
            <CardDescription>
              We're working on integrations with popular tools and platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-[12px] opacity-50">
                <img src="/zapier.jpeg" alt="Zapier" className="h-12 w-12 mx-auto mb-2 rounded" />
                <p className="text-xs font-medium">Zapier</p>
                <Badge variant="secondary" className="text-xs mt-1">Coming Soon</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="animate-pulse text-[#5C5855] font-mono">Loading...</div>
      </main>
    }>
      <IntegrationsContent />
    </Suspense>
  )
}
