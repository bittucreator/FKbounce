'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Webhook, Copy, Check, AlertCircle } from 'lucide-react'

interface WebhookConfigModalProps {
  onWebhookCreated?: () => void
}

const WEBHOOK_EVENTS = [
  { id: 'VERIFICATION_COMPLETED', label: 'Verification Completed', description: 'Single email verified successfully' },
  { id: 'VERIFICATION_FAILED', label: 'Verification Failed', description: 'Single email verification failed' },
  { id: 'BATCH_COMPLETED', label: 'Batch Completed', description: 'Bulk verification job finished' },
  { id: 'BATCH_PROGRESS', label: 'Batch Progress', description: 'Progress updates every 10%' },
  { id: 'QUOTA_WARNING', label: 'Quota Warning', description: 'Less than 20% quota remaining' },
  { id: 'QUOTA_EXCEEDED', label: 'Quota Exceeded', description: 'Monthly quota limit reached' }
]

export default function WebhookConfigModal({ onWebhookCreated }: WebhookConfigModalProps) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['BATCH_COMPLETED'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [webhookSecret, setWebhookSecret] = useState('')
  const [copied, setCopied] = useState(false)

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    // Validate URL
    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL')
      setLoading(false)
      return
    }

    if (selectedEvents.length === 0) {
      setError('Please select at least one event')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          events: selectedEvents
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create webhook')
      }

      setWebhookSecret(data.webhook.secret)
      setSuccess(true)
      
      // Call callback to refresh webhook list
      if (onWebhookCreated) {
        onWebhookCreated()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webhook')
    } finally {
      setLoading(false)
    }
  }

  const handleCopySecret = () => {
    navigator.clipboard.writeText(webhookSecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setOpen(false)
    // Reset form after a short delay
    setTimeout(() => {
      setUrl('')
      setSelectedEvents(['BATCH_COMPLETED'])
      setError('')
      setSuccess(false)
      setWebhookSecret('')
      setCopied(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Webhook className="mr-2 h-4 w-4" />
          Configure Webhook
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Webhook</DialogTitle>
          <DialogDescription>
            Set up a webhook endpoint to receive real-time notifications about verification events
          </DialogDescription>
        </DialogHeader>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-app.com/webhook"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <p className="text-xs text-gray-600">
                The endpoint where you want to receive webhook notifications
              </p>
            </div>

            <div className="space-y-3">
              <Label>Events to Subscribe</Label>
              <p className="text-xs text-gray-600">
                Select which events should trigger this webhook
              </p>
              <div className="space-y-3 border rounded-lg p-4">
                {WEBHOOK_EVENTS.map(event => (
                  <div key={event.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={event.id}
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={() => handleEventToggle(event.id)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={event.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {event.label}
                      </label>
                      <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Webhook'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Webhook created successfully! Save your secret key - it won't be shown again.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input value={url} readOnly />
            </div>

            <div className="space-y-2">
              <Label>Webhook Secret</Label>
              <div className="flex gap-2">
                <Input value={webhookSecret} readOnly className="font-mono text-sm" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                Use this secret to verify webhook signatures with HMAC-SHA256
              </p>
            </div>

            <div className="space-y-2">
              <Label>Subscribed Events</Label>
              <div className="flex flex-wrap gap-2">
                {selectedEvents.map(eventId => {
                  const event = WEBHOOK_EVENTS.find(e => e.id === eventId)
                  return (
                    <span key={eventId} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {event?.label}
                    </span>
                  )
                })}
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> All webhook requests include an <code>X-Webhook-Signature</code> header 
                with an HMAC-SHA256 signature. Always verify this signature using your webhook secret.
              </AlertDescription>
            </Alert>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
