'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Settings as SettingsIcon } from 'lucide-react'
import AppBreadcrumb from '@/components/AppBreadcrumb'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    enable_catch_all_check: true,
    enable_domain_cache: true
  })

  useEffect(() => {
    checkAuth()
    fetchSettings()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      if (data.settings) {
        setSettings({
          enable_catch_all_check: data.settings.enable_catch_all_check,
          enable_domain_cache: data.settings.enable_domain_cache
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        alert('Settings saved successfully!')
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
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
    <main className="min-h-screen flex flex-col">
      <header className="border-b-[0.5px] bg-[#fafafa]">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/Logo-dark.svg" alt="FKbounce" className="h-7 w-auto" />
            </button>
            <div className="ml-1">
              <AppBreadcrumb />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 bg-[#fafafa] py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-[#020202]" />
            <h2 className="text-3xl font-bold text-[#020202] font-[family-name:var(--font-geist)]">
              Verification Settings
            </h2>
          </div>
          <p className="text-[#5C5855] font-mono text-sm">
            Customize your email verification preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance & Features</CardTitle>
            <CardDescription>
              Configure verification behavior to balance speed and accuracy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between py-4 border-b">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="catch-all" className="text-base font-semibold">
                  Catch-All Detection
                </Label>
                <p className="text-sm text-[#5C5855]">
                  Detect domains that accept all email addresses. Disabling this speeds up verification by ~30% but reduces accuracy.
                </p>
              </div>
              <Switch
                id="catch-all"
                checked={settings.enable_catch_all_check}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_catch_all_check: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="domain-cache" className="text-base font-semibold">
                  Domain Caching
                </Label>
                <p className="text-sm text-[#5C5855]">
                  Cache domain verification results for 1 hour. Significantly speeds up bulk verification of emails from the same domain.
                </p>
              </div>
              <Switch
                id="domain-cache"
                checked={settings.enable_domain_cache}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_domain_cache: checked }))
                }
              />
            </div>

            <div className="pt-4">
              <Button 
                onClick={saveSettings} 
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Performance Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5" />
              <div>
                <p className="font-semibold text-[#020202]">SMTP Timeout: 10 seconds</p>
                <p className="text-[#5C5855]">With exponential backoff retry (3 attempts max)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5" />
              <div>
                <p className="font-semibold text-[#020202]">Connection Pooling: Enabled</p>
                <p className="text-[#5C5855]">Bulk verifications use connection pooling for better performance</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5" />
              <div>
                <p className="font-semibold text-[#020202]">Domain Cache TTL: 1 hour</p>
                <p className="text-[#5C5855]">Cached results expire after 60 minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </main>
  )
}
