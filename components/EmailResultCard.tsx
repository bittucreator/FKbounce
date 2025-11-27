'use client'

import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { AlertTriangle, Copy, Check, FolderPlus } from 'lucide-react'
import { Button } from './ui/button'
import { useState } from 'react'

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

interface EmailResultCardProps {
  result: VerificationResult
  onSaveToList?: () => void
}

export default function EmailResultCard({ result, onSaveToList }: EmailResultCardProps) {
  const [copied, setCopied] = useState(false)

  // Determine risk level
  const getRisk = () => {
    if (result.is_spam_trap) return { label: 'High', color: 'text-red-600 dark:text-red-400' }
    if (result.disposable) return { label: 'High', color: 'text-red-600 dark:text-red-400' }
    if (!result.smtp) return { label: 'Medium', color: 'text-orange-600 dark:text-orange-400' }
    if (result.catch_all) return { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400' }
    if (result.is_role_based) return { label: 'Low', color: 'text-yellow-600 dark:text-yellow-400' }
    return { label: 'Low', color: 'text-green-600 dark:text-green-400' }
  }

  // Determine status badge
  const getStatus = () => {
    if (result.disposable) return { label: 'Disposable', color: 'bg-red-500' }
    if (result.is_spam_trap) return { label: 'Spam Trap', color: 'bg-red-500' }
    if (result.catch_all) return { label: 'Risky', color: 'bg-yellow-500' }
    if (!result.smtp) return { label: 'Unverifiable', color: 'bg-orange-500' }
    if (!result.valid) return { label: 'Invalid', color: 'bg-red-500' }
    return { label: 'Valid', color: 'bg-green-500' }
  }

  const status = getStatus()
  const risk = getRisk()

  // Calculate quality score (0-100)
  const qualityScore = result.reputation_score ?? (() => {
    let score = 0
    if (result.syntax) score += 15
    if (result.dns) score += 15
    if (result.smtp) score += 25
    if (!result.catch_all) score += 15
    if (!result.disposable) score += 15
    if (!result.is_role_based) score += 5
    if (!result.is_spam_trap) score += 10
    return Math.min(100, score)
  })()

  // Inbox placement score
  const inboxScore = result.inbox_placement_score ?? (result.smtp ? (result.catch_all ? 60 : 85) : 20)

  // Extract username and domain
  const [username, domain] = result.email.split('@')

  // Get MX record display
  const getMxRecord = () => {
    if (result.smtp_provider === 'Google Workspace') return `aspmx.l.google.com`
    if (result.smtp_provider === 'Microsoft 365') return `${domain}.mail.protection.outlook.com`
    if (result.smtp_provider === 'Zoho') return `mx.zoho.com`
    return result.mx_priority?.length ? `mx.${domain}` : '--'
  }

  // Check if it's a free email provider
  const isFreeEmail = () => {
    const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com', 'mail.com']
    return freeProviders.includes(domain.toLowerCase())
  }

  const copyToClipboard = async () => {
    const text = JSON.stringify(result, null, 2)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="overflow-hidden">
      {/* Status Header */}
      <div className={`px-6 py-4 ${
        status.label === 'Valid' ? 'bg-green-50 dark:bg-green-950/30' :
        status.label === 'Risky' ? 'bg-yellow-50 dark:bg-yellow-950/30' :
        'bg-red-50 dark:bg-red-950/30'
      }`}>
        <Badge className={`${status.color} text-white mb-2`}>
          {status.label}
        </Badge>
        <h3 className="font-semibold text-lg font-mono">{result.email}</h3>
        <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Main Verification Results */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Verification Results
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <ResultRow label="Email" value={result.email} mono />
            <ResultRow label="Valid" value={result.valid} isBoolean />
            <ResultRow label="Syntax" value={result.syntax} isBoolean />
            <ResultRow label="DNS" value={result.dns} isBoolean />
            <ResultRow label="SMTP" value={result.smtp} isBoolean />
            <ResultRow label="Disposable" value={result.disposable} isBoolean invertColor />
            <ResultRow label="Catch-All" value={result.catch_all} isBoolean warning />
          </div>
        </div>

        {/* Scores Section */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Quality Scores
          </h4>
          <div className="space-y-4">
            {/* Reputation Score */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Reputation</span>
                <span className="text-sm font-bold">{qualityScore}/100</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    qualityScore >= 80 ? 'bg-green-500' :
                    qualityScore >= 60 ? 'bg-yellow-500' :
                    qualityScore >= 40 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${qualityScore}%` }}
                />
              </div>
            </div>

            {/* Risk Level */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Risk</span>
              <span className={`text-sm font-bold ${risk.color}`}>{risk.label}</span>
            </div>

            {/* Email Quality Score */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Email Quality Score</span>
                <span className="text-sm font-bold">{qualityScore}%</span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-red-400" style={{ width: '25%', opacity: qualityScore < 25 ? 1 : 0.3 }} />
                <div className="h-full bg-orange-400" style={{ width: '25%', opacity: qualityScore >= 25 && qualityScore < 50 ? 1 : 0.3 }} />
                <div className="h-full bg-yellow-400" style={{ width: '25%', opacity: qualityScore >= 50 && qualityScore < 75 ? 1 : 0.3 }} />
                <div className="h-full bg-green-500" style={{ width: '25%', opacity: qualityScore >= 75 ? 1 : 0.3 }} />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            {/* Inbox Placement */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Inbox %</span>
                <span className="text-sm font-bold">{inboxScore}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    inboxScore >= 70 ? 'bg-green-500' :
                    inboxScore >= 40 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${inboxScore}%` }}
                />
              </div>
            </div>

            {/* Message */}
            <div className="flex items-start justify-between pt-2">
              <span className="text-sm">Message</span>
              <span className="text-sm text-right max-w-[60%] text-muted-foreground">{result.message}</span>
            </div>
          </div>
        </div>

        {/* Attributes Section */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Attributes
          </h4>
          <div className="space-y-2">
            <AttributeRow label="Username" value={username} />
            <AttributeRow label="Domain" value={domain} />
            <AttributeRow label="Is Free" value={isFreeEmail() ? 'Yes' : 'No'} />
            <AttributeRow label="Provider" value={result.smtp_provider || '--'} />
            <AttributeRow label="MX Record" value={getMxRecord()} mono />
            {result.is_role_based && (
              <AttributeRow label="Role Type" value={result.role_type || 'Generic'} />
            )}
            {result.has_spf !== undefined && (
              <AttributeRow label="Has SPF" value={result.has_spf ? 'Yes' : 'No'} />
            )}
            {result.has_dmarc !== undefined && (
              <AttributeRow label="Has DMARC" value={result.has_dmarc ? 'Yes' : 'No'} />
            )}
            {result.dmarc_policy && (
              <AttributeRow label="DMARC Policy" value={result.dmarc_policy} />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex-1"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Result
              </>
            )}
          </Button>
          {onSaveToList && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveToList}
              className="flex-1"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Save to List
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Result Row Component for verification results
function ResultRow({ 
  label, 
  value, 
  isBoolean = false,
  invertColor = false,
  warning = false,
  mono = false
}: { 
  label: string
  value: boolean | string
  isBoolean?: boolean
  invertColor?: boolean
  warning?: boolean
  mono?: boolean
}) {
  if (isBoolean) {
    const boolValue = value as boolean
    const showGreen = invertColor ? !boolValue : boolValue
    
    return (
      <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-1">
          {warning && boolValue && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
          <span className={`text-sm font-bold ${showGreen ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {boolValue ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg col-span-2">
      <span className="text-sm font-medium">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono text-xs' : ''} truncate max-w-[60%] text-right`}>
        {value}
      </span>
    </div>
  )
}

// Attribute Row Component
function AttributeRow({ 
  label, 
  value, 
  mono = false 
}: { 
  label: string
  value: string
  mono?: boolean 
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  )
}
