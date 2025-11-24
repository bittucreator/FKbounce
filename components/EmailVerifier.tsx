'use client'

import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { CheckCircle2, XCircle, Loader2, Mail, Server, Database, AlertTriangle, Copy, Check, FolderPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'
import { Progress } from '../components/ui/progress'

interface VerificationResult {
  email: string
  valid: boolean
  syntax: boolean
  dns: boolean
  smtp: boolean
  disposable: boolean
  catch_all: boolean
  message: string
  // Advanced intelligence
  reputation_score?: number
  is_spam_trap?: boolean
  is_role_based?: boolean
  role_type?: string
  email_age?: string
  domain_health_score?: number
  inbox_placement_score?: number
  mx_priority?: number[]
  insights?: string[]
}

export default function EmailVerifier() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
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

  const copyToClipboard = async () => {
    if (!result) return
    
    const text = `Email: ${result.email}\nValid: ${result.valid ? 'Yes' : 'No'}\nSyntax: ${result.syntax ? 'Valid' : 'Invalid'}\nDNS: ${result.dns ? 'Found' : 'Not Found'}\nSMTP: ${result.smtp ? 'Passed' : 'Failed'}\nDisposable: ${result.disposable ? 'Yes' : 'No'}\nMessage: ${result.message}`
    
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.valid ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <CardTitle>Valid Email Address</CardTitle>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-destructive" />
                    <CardTitle>Invalid Email Address</CardTitle>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <img src="/Copy.svg" alt="Copy" className="mr-1 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <CardDescription className="font-mono">{result.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Syntax Valid</span>
                    </div>
                    {result.syntax ? (
                      <Badge>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Valid
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Invalid
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">DNS/MX Records</span>
                    </div>
                    {result.dns ? (
                      <Badge>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Found
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Found
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">SMTP Check</span>
                    </div>
                    {result.smtp ? (
                      <Badge>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Passed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Disposable</span>
                    </div>
                    {result.disposable ? (
                      <Badge variant="outline">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        No
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Catch-All</span>
                    </div>
                    {result.catch_all ? (
                      <Badge variant="outline">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        No
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {result.valid ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-1">Verification Result</p>
                    <p className="text-base font-medium">{result.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Email Intelligence */}
            {result.reputation_score !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Email Intelligence</CardTitle>
                  <CardDescription>Advanced analysis and reputation metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Reputation Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Reputation Score</span>
                      <span className="text-2xl font-bold">{result.reputation_score}/100</span>
                    </div>
                    <Progress 
                      value={result.reputation_score} 
                      className={`h-3 ${
                        result.reputation_score >= 80 ? 'bg-green-100 [&>div]:bg-green-600' :
                        result.reputation_score >= 60 ? 'bg-blue-100 [&>div]:bg-blue-600' :
                        result.reputation_score >= 40 ? 'bg-yellow-100 [&>div]:bg-yellow-600' :
                        'bg-red-100 [&>div]:bg-red-600'
                      }`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.reputation_score >= 80 ? '✅ Excellent reputation' :
                       result.reputation_score >= 60 ? '✓ Good reputation' :
                       result.reputation_score >= 40 ? '⚠ Moderate reputation' :
                       '❌ Poor reputation'}
                    </p>
                  </div>

                  {/* Inbox Placement Score */}
                  {result.inbox_placement_score !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Inbox Placement Probability</span>
                        <span className="text-lg font-semibold">{result.inbox_placement_score}%</span>
                      </div>
                      <Progress 
                        value={result.inbox_placement_score} 
                        className={`h-2 ${
                          result.inbox_placement_score >= 70 ? 'bg-green-100 [&>div]:bg-green-500' :
                          result.inbox_placement_score >= 40 ? 'bg-yellow-100 [&>div]:bg-yellow-500' :
                          'bg-red-100 [&>div]:bg-red-500'
                        }`}
                      />
                    </div>
                  )}

                  {/* Domain Health Score */}
                  {result.domain_health_score !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Domain Health</span>
                        <span className="text-lg font-semibold">{result.domain_health_score}/100</span>
                      </div>
                      <Progress 
                        value={result.domain_health_score} 
                        className={`h-2 ${
                          result.domain_health_score >= 70 ? 'bg-green-100 [&>div]:bg-green-500' :
                          result.domain_health_score >= 40 ? 'bg-orange-100 [&>div]:bg-orange-500' :
                          'bg-red-100 [&>div]:bg-red-500'
                        }`}
                      />
                    </div>
                  )}

                  {/* Warning Badges */}
                  <div className="flex flex-wrap gap-2">
                    {result.is_spam_trap && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Spam Trap Detected
                      </Badge>
                    )}
                    {result.is_role_based && (
                      <Badge variant="secondary" className="gap-1">
                        <Mail className="h-3 w-3" />
                        Role-Based: {result.role_type}
                      </Badge>
                    )}
                    {result.email_age && (
                      <Badge variant="outline" className="gap-1">
                        <Server className="h-3 w-3" />
                        Age: {result.email_age}
                      </Badge>
                    )}
                  </div>

                  {/* MX Priority */}
                  {result.mx_priority && result.mx_priority.length > 0 && (
                    <div>
                      <span className="text-sm font-medium block mb-1">MX Records Priority</span>
                      <div className="flex gap-1">
                        {result.mx_priority.map((priority, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {priority}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Insights */}
                  {result.insights && result.insights.length > 0 && (
                    <div>
                      <span className="text-sm font-medium block mb-2">Insights</span>
                      <div className="space-y-2">
                        {result.insights.map((insight, idx) => (
                          <div key={idx} className="text-sm text-muted-foreground bg-muted/50 rounded-[12px] px-3 py-2">
                            {insight}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Save to List
                </Button>
              </DialogTrigger>
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
          </CardContent>
        </Card>
        </>
      )}
      </div>
    )
}