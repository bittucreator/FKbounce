'use client'

import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { CheckCircle2, XCircle, Loader2, Mail, Server, Database, AlertTriangle, Copy, Check } from 'lucide-react'

interface VerificationResult {
  email: string
  valid: boolean
  syntax: boolean
  dns: boolean
  smtp: boolean
  disposable: boolean
  message: string
}

export default function EmailVerifier() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null)

  useEffect(() => {
    fetchUsage()
  }, [])

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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
