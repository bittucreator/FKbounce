'use client'

import { useState, useRef } from 'react'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { CheckCircle2, XCircle, Loader2, Download, Shield, AlertTriangle, Mail, Database, Server, Upload, Copy, Check } from 'lucide-react'

interface VerificationResult {
  email: string
  valid: boolean
  syntax: boolean
  dns: boolean
  smtp: boolean
  disposable: boolean
  message: string
}

interface BulkVerificationResponse {
  total: number
  valid: number
  invalid: number
  results: VerificationResult[]
}

export default function BulkVerifier() {
  const [emails, setEmails] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<BulkVerificationResponse | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-correct emails: remove spaces and fix common typos
  const autocorrectEmails = (value: string) => {
    return value
      .split(/[\n,\s]+/)
      .map((e: string) => e.trim().replace(/\s+/g, '').toLowerCase())
      .filter((e: string) => e.length > 0)
      .join('\n')
  }

  const copyToClipboard = async () => {
    if (!results) return
    
    const validEmails = results.results.filter(r => r.valid).map(r => r.email).join('\n')
    await navigator.clipboard.writeText(validEmails)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Please upload a CSV file')
        return
      }
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n')
      const emailList: string[] = []

      lines.forEach(line => {
        const columns = line.split(',')
        columns.forEach(col => {
          const email = col.trim().replace(/["']/g, '')
          if (email && email.includes('@')) {
            emailList.push(email)
          }
        })
      })

      setEmails(emailList.join('\n'))
      setError('')
    }

    reader.onerror = () => {
      setError('Failed to read CSV file')
    }

    reader.readAsText(file)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    processFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!emails.trim()) {
      setError('Please enter at least one email address')
      return
    }

    const emailList = emails
      .split(/[\n,\s]+/)
      .map((e: string) => e.trim())
      .filter((e: string) => e.length > 0)

    if (emailList.length === 0) {
      setError('No valid emails found')
      return
    }

    if (emailList.length > 1000000) {
      setError('Maximum 1,000,000 emails allowed per request')
      return
    }

    setLoading(true)
    setError('')
    setResults(null)

    try {
      const response = await fetch('/api/verify-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: emailList }),
      })

      if (!response.ok) {
        throw new Error('Failed to verify emails')
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify emails')
    } finally {
      setLoading(false)
    }
  }

  const downloadResults = () => {
    if (!results) return

    const csv = [
      ['Email', 'Valid', 'Syntax', 'DNS', 'SMTP', 'Disposable', 'Message'].join(','),
      ...results.results.map((r: VerificationResult) => 
        [r.email, r.valid, r.syntax, r.dns, r.smtp, r.disposable, `"${r.message}"`].join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email-verification-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Bulk Email Verification
          </CardTitle>
          <CardDescription>
            Verify multiple email addresses at once (up to 1,000,000 emails per request)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap- mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full items-center justify-center flex gap-0"
                >
                  <img src="/csv-upload.svg" alt="Upload" className="mr-2 h-6 w-6" />
                  Upload CSV File
                </Button>
              </div>
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative ${isDragging ? 'ring-2 ring-primary' : ''}`}
              >
                {isDragging && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 rounded-md border-2 border-dashed border-primary">
                    <div className="text-center">
                      <Upload className="h-12 w-12 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">Drop CSV file here</p>
                    </div>
                  </div>
                )}
                <Textarea
                  placeholder="Enter email addresses (one per line or comma-separated)&#10;&#10;Example:&#10;user1@example.com&#10;user2@example.com&#10;user3@example.com&#10;&#10;Or drag & drop a CSV file here"
                  value={emails}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmails(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !loading) {
                      handleSubmit(e as any)
                    }
                  }}
                  disabled={loading}
                  rows={10}
                  className="font-mono"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Maximum 1,000,000 emails per request. CSV files should contain email addresses in any column.
              </p>
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full items-center justify-center flex gap-0"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying {emails.split(/[\n,\s]+/).filter((e: string) => e.trim().length > 0).length} emails...
                </>
              ) : (
                <>
                  <img src="/check.svg" alt="Verify" className="mr-1 h-6 w-6 brightness-0 invert" />
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

      {results && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img src="/shield.svg" alt="Shield" className="h-5 w-5" />
                Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Total Emails</p>
                      <p className="text-4xl font-bold">{results.total}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Valid</p>
                      <p className="text-4xl font-bold text-green-600">{results.valid}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Invalid</p>
                      <p className="text-4xl font-bold text-destructive">{results.invalid}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={downloadResults}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex-1"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <img src="/Copy.svg" alt="Copy" className="mr-1 h-4 w-4" />
                      Copy Valid Emails
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                Complete verification details for all {results.total} email addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Valid</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Mail className="h-3 w-3" />
                          Syntax
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Database className="h-3 w-3" />
                          DNS
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Server className="h-3 w-3" />
                          SMTP
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Disposable
                        </div>
                      </TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.results.map((result: VerificationResult, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm font-medium">
                          {result.email}
                        </TableCell>
                        <TableCell className="text-center">
                          {result.valid ? (
                            <Badge>
                              <CheckCircle2 className="h-3 w-3" />
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3" />
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {result.syntax ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {result.dns ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {result.smtp ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {result.disposable ? (
                            <Badge variant="outline">
                              <AlertTriangle className="h-3 w-3" />
                            </Badge>
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {result.message}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
