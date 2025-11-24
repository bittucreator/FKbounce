'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Webhook, Trash2, Power, PowerOff, AlertCircle, RefreshCw } from 'lucide-react'
import WebhookConfigModal from './WebhookConfigModal'

interface WebhookConfig {
  id: string
  url: string
  secret: string
  events: string[]
  is_active: boolean
  created_at: string
}

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchWebhooks = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/webhooks')
      
      if (!response.ok) {
        throw new Error('Failed to fetch webhooks')
      }

      const data = await response.json()
      setWebhooks(data.webhooks || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load webhooks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const handleToggleActive = async (webhookId: string, currentStatus: boolean) => {
    try {
      setActionLoading(webhookId)
      const response = await fetch('/api/webhooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: webhookId,
          is_active: !currentStatus
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update webhook')
      }

      await fetchWebhooks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update webhook')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
      return
    }

    try {
      setActionLoading(webhookId)
      const response = await fetch(`/api/webhooks?id=${webhookId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete webhook')
      }

      await fetchWebhooks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Configuration
            </CardTitle>
            <CardDescription className="mt-1">
              Configure webhooks to receive real-time notifications
            </CardDescription>
          </div>
          <WebhookConfigModal onWebhookCreated={fetchWebhooks} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {webhooks.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-[12px]">
            <Webhook className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 mb-2">No webhooks configured</p>
            <p className="text-sm text-gray-500 mb-4">
              Create a webhook to receive real-time notifications about verification events
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map(webhook => (
              <div
                key={webhook.id}
                className="border rounded-[12px] p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {webhook.url}
                      </code>
                      <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                        {webhook.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>Secret: {webhook.secret}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {webhook.events.map(event => (
                        <span
                          key={event}
                          className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {event.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>

                    <div className="text-xs text-gray-500">
                      Created {new Date(webhook.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(webhook.id, webhook.is_active)}
                      disabled={actionLoading === webhook.id}
                    >
                      {webhook.is_active ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(webhook.id)}
                      disabled={actionLoading === webhook.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Important:</strong> All webhook requests include an <code className="bg-gray-100 px-1 py-0.5 rounded">X-Webhook-Signature</code> header 
            with an HMAC-SHA256 signature. Always verify this signature using your webhook secret to ensure the request is from FKbounce.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
