'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import AppBreadcrumb from '@/components/AppBreadcrumb'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NotionDatabase {
  id: string
  title: string
  icon?: string | null
}

interface NotionConnection {
  connected: boolean
  workspace_name?: string
  databases?: NotionDatabase[]
  selected_database_id?: string
}

function IntegrationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [notionConnection, setNotionConnection] = useState<NotionConnection>({ connected: false })
  const [selectedDatabase, setSelectedDatabase] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchNotionConnection()
    
    // Check for OAuth success/error
    const notionSuccess = searchParams.get('notion_success')
    const notionError = searchParams.get('notion_error')
    
    if (notionSuccess) {
      fetchNotionConnection()
    }
    
    if (notionError) {
      alert(`Notion connection failed: ${notionError}`)
    }
  }, [searchParams])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
    }
  }

  const fetchNotionConnection = async () => {
    try {
      const response = await fetch('/api/integrations/notion')
      const data = await response.json()
      
      if (response.ok) {
        setNotionConnection(data)
        if (data.selected_database_id) {
          setSelectedDatabase(data.selected_database_id)
        }
      }
    } catch (error) {
      console.error('Error fetching Notion connection:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectNotion = () => {
    const clientId = process.env.NEXT_PUBLIC_NOTION_CLIENT_ID
    const redirectUri = 'https://fkbounce.com/api/integrations/notion/callback'
    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`
    
    window.location.href = authUrl
  }

  const disconnectNotion = async () => {
    if (!confirm('Are you sure you want to disconnect Notion?')) {
      return
    }

    try {
      const response = await fetch('/api/integrations/notion', {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotionConnection({ connected: false })
        setSelectedDatabase('')
        alert('Notion disconnected successfully')
      } else {
        alert('Failed to disconnect Notion')
      }
    } catch (error) {
      console.error('Error disconnecting Notion:', error)
      alert('Failed to disconnect Notion')
    }
  }

  const saveDatabase = async () => {
    if (!selectedDatabase) {
      alert('Please select a database')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/integrations/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_database_id: selectedDatabase }),
      })

      if (response.ok) {
        alert('Database saved successfully!')
        fetchNotionConnection()
      } else {
        alert('Failed to save database')
      }
    } catch (error) {
      console.error('Error saving database:', error)
      alert('Failed to save database')
    } finally {
      setSaving(false)
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

        {/* Notion Integration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/notion-icon.svg" alt="Notion" className="h-10 w-10" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }} />
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Notion
                    {notionConnection.connected && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Save verified emails directly to your Notion databases
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!notionConnection.connected ? (
              <>
                <Alert>
                  <AlertDescription>
                    Connect your Notion workspace to save verified email results directly to your databases. 
                    Perfect for team collaboration and CRM integration.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Features:</h4>
                  <ul className="list-disc list-inside text-sm text-[#5C5855] space-y-1">
                    <li>Save single email verification results</li>
                    <li>Bulk export to Notion databases</li>
                    <li>All verification details included (Syntax, DNS, SMTP, etc.)</li>
                    <li>Choose any database in your workspace</li>
                  </ul>
                </div>
                <Button onClick={connectNotion} className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect Notion
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-semibold text-sm">Workspace: {notionConnection.workspace_name}</p>
                      <p className="text-xs text-[#5C5855]">Connected and ready to use</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>

                  {notionConnection.databases && notionConnection.databases.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Select Database</label>
                      <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a database to save emails" />
                        </SelectTrigger>
                        <SelectContent>
                          {notionConnection.databases.map((db) => (
                            <SelectItem key={db.id} value={db.id}>
                              {db.icon && <span className="mr-2">{db.icon}</span>}
                              {db.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-[#5C5855]">
                        Verified emails will be saved to this database
                      </p>
                      {selectedDatabase && selectedDatabase !== notionConnection.selected_database_id && (
                        <Button onClick={saveDatabase} disabled={saving} className="w-full">
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Database Selection'
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  <Alert>
                    <AlertDescription className="text-xs">
                      <strong>Tip:</strong> Use the "Save to Notion" button when verifying emails to export results to your selected database.
                    </AlertDescription>
                  </Alert>
                </div>

                <Button onClick={disconnectNotion} variant="destructive" className="w-full">
                  Disconnect Notion
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Coming Soon Section */}
        <Card className="mt-6 opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              More Integrations
              <Badge variant="outline">Coming Soon</Badge>
            </CardTitle>
            <CardDescription>
              We're working on adding more integrations to streamline your workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg text-center">
                <p className="text-sm font-semibold">Airtable</p>
                <p className="text-xs text-[#5C5855]">Export to Airtable bases</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <p className="text-sm font-semibold">Google Sheets</p>
                <p className="text-xs text-[#5C5855]">Sync with spreadsheets</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <p className="text-sm font-semibold">Zapier</p>
                <p className="text-xs text-[#5C5855]">Connect 5000+ apps</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <p className="text-sm font-semibold">Webhooks</p>
                <p className="text-xs text-[#5C5855]">Custom automations</p>
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
      <main className="min-h-screen flex items-center justify-center bg-[#eeeeee]">
        <div className="animate-pulse text-[#5C5855] font-mono">Loading...</div>
      </main>
    }>
      <IntegrationsContent />
    </Suspense>
  )
}
