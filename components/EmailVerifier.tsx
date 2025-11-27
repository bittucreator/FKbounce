'use client'

import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Loader2, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import EmailResultCard from './EmailResultCard'

interface VerificationResult {
  email: string
  valid: boolean
  syntax: boolean
  dns: boolean
  smtp: boolean
  disposable: boolean
  catch_all: boolean
  message: string
  smtp_provider?: string
  smtp_provider_type?: string
  confidence_level?: number
  reputation_score?: number
  is_spam_trap?: boolean
  is_role_based?: boolean
  role_type?: string
  email_age?: string
  domain_health_score?: number
  inbox_placement_score?: number
  mx_priority?: number[]
  insights?: string[]
  has_spf?: boolean
  has_dmarc?: boolean
  spf_record?: string
  dmarc_policy?: string
}

export default function EmailVerifier() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState('')
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null)
  const [lists, setLists] = useState<any[]>([])
  const [isListDialogOpen, setIsListDialogOpen] = useState(false)
  const [savingToList, setSavingToList] = useState(false)

  useEffect(() => {
    fetchUsage()
    fetchLists()
  }, [])

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/lists')
      if (response.ok) {
        const data = await response.json()
        setLists(data.lists || [])
      }
    } catch (err) {
      console.error('Failed to fetch lists:', err)
    }
  }

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/check-limit')
      if (response.ok) {
        const data = await response.json()
        setUsage({ used: data.used, limit: data.limit, remaining: data.remaining })
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err)
    }
  }

  // Auto-correct email: remove spaces and fix common typos
  const autocorrectEmail = (value: string) => {
    return value
      .trim()
      .replace(/\s+/g, '') // Remove all spaces
      .replace(/,,/g, ',') // Fix double commas
      .replace(/@{2,}/g, '@') // Fix multiple @ signs
      .replace(/\.{2,}/g, '.') // Fix multiple dots
      .toLowerCase()
  }

  const saveToList = async (listId: string) => {
    if (!result) return

    setSavingToList(true)
    try {
      const response = await fetch(`/api/lists/${listId}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: [{
            email_address: result.email,
            verification_status: result.valid ? 'valid' : 'invalid',
            verification_result: result
          }]
        })
      })

      if (response.ok) {
        setIsListDialogOpen(false)
        // Show success feedback
        alert('Email added to list successfully!')
      }
    } catch (err) {
      console.error('Failed to save to list:', err)
      alert('Failed to add email to list')
    } finally {
      setSavingToList(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const correctedEmail = autocorrectEmail(email)
    
    if (!correctedEmail) {
      setError('Please enter an email address')
      return
    }

    setEmail(correctedEmail)
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: correctedEmail }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to verify email')
      }

      const data = await response.json()
      setResult(data)
      await fetchUsage() // Refresh usage after verification
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Single Email Verification
          </CardTitle>
          <CardDescription>
            Enter an email address to verify its validity through multiple checks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' && !loading) {
                    handleSubmit(e)
                  }
                }}
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full items-center justify-center flex gap-0"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <img src="/check.svg" alt="Verify" className="mr-2 h-6 w-6 brightness-0 invert" />
                  Verify now
                </>
              )}
            </Button>
          </form>

          {error && (
            <Card className="mt-6 border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">{error}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          <EmailResultCard 
            result={result} 
            onSaveToList={() => setIsListDialogOpen(true)} 
          />
          
          <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save to List</DialogTitle>
                <DialogDescription>
                  Choose a list to save this verified email
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {lists.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No lists found. Create a list in the Lists tab first.
                  </p>
                ) : (
                  lists.map((list: any) => (
                    <Button
                      key={list.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => saveToList(list.id)}
                      disabled={savingToList}
                    >
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: list.color }}
                      />
                      {list.name}
                      <Badge variant="secondary" className="ml-auto">
                        {list.email_count || 0}
                      </Badge>
                    </Button>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
      </div>
    )
}