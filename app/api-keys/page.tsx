'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import { ArrowLeft, Key, Copy, Eye, EyeOff, Trash2, Plus, Code, Book, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { CodeBlock } from '../../components/ui/code-block'
import WebhookManager from '../../components/WebhookManager'
import WebhookConfigModal from '../../components/WebhookConfigModal'

interface ApiKey {
  id: string
  name: string
  key: string
  created_at: string
  last_used_at: string | null
}

interface ApiStatus {
  endpoint: string
  status: 'checking' | 'operational' | 'error'
  responseTime?: number
}

interface Analytics {
  period: string
  plan: {
    type: string
    verifications_used: number
    verifications_limit: number
    usage_percentage: number
  }
  summary: {
    total_verifications: number
    total_valid: number
    total_invalid: number
    valid_rate: number
    single_verifications: number
    bulk_verifications: number
    active_api_keys: number
    active_webhooks: number
  }
}

export default function ApiKeysPage() {
  const [loading, setLoading] = useState(true)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showKey, setShowKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<string>('free')
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([
    { endpoint: 'Single Email Verification', status: 'checking' },
    { endpoint: 'Bulk Email Verification', status: 'checking' }
  ])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [activeTab, setActiveTab] = useState('keys')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadApiKeys()
    loadAnalytics()
  }, [])

  const checkApiStatus = async (apiKey: string) => {
    setApiStatuses([
      { endpoint: 'Single Email Verification', status: 'checking' },
      { endpoint: 'Bulk Email Verification', status: 'checking' }
    ])

    const endpoints = [
      { name: 'Single Email Verification', url: '/api/verify-with-key' },
      { name: 'Bulk Email Verification', url: '/api/verify-bulk-with-key' }
    ]

    const statusChecks = endpoints.map(async (endpoint) => {
      try {
        const startTime = Date.now()
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(
            endpoint.name === 'Bulk Email Verification' 
              ? { emails: ['test@example.com'] }
              : { email: 'test@example.com' }
          )
        })
        const responseTime = Date.now() - startTime
        const data = await response.json()

        // Check if response is successful (200-299 status or valid JSON response)
        if (response.ok || (data && typeof data === 'object')) {
          return {
            endpoint: endpoint.name,
            status: 'operational' as const,
            responseTime
          }
        } else {
          return {
            endpoint: endpoint.name,
            status: 'error' as const
          }
        }
      } catch (error) {
        return {
          endpoint: endpoint.name,
          status: 'error' as const
        }
      }
    })

    const results = await Promise.all(statusChecks)
    setApiStatuses(results)
  }

  const loadApiKeys = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/')
      return
    }

    // Get user plan
    const { data: planData } = await supabase
      .from('user_plans')
      .select('plan')
      .eq('user_id', user.id)
      .single()

    if (planData) {
      setUserPlan(planData.plan)
    }

    // Fetch API keys
    const { data: keysData } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (keysData) {
      setApiKeys(keysData)
    }

    setLoading(false)
  }

  const generateApiKey = () => {
    const prefix = 'fkb_'
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let key = prefix
    for (let i = 0; i < 48; i++) {
      key += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return key
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return

    setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newKey = generateApiKey()

      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newKeyName,
          key: newKey,
        })

      if (error) throw error

      setNewKeyName('')
      await loadApiKeys()
      setShowKey(newKey)
      
      // Test API status with the new key
      checkApiStatus(newKey)
    } catch (error) {
      console.error('Error creating API key:', error)
      alert('Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)

      if (error) throw error

      await loadApiKeys()
    } catch (error) {
      console.error('Error deleting API key:', error)
      alert('Failed to delete API key')
    }
  }

  const copyToClipboard = async (key: string) => {
    await navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const maskKey = (key: string) => {
    return key.substring(0, 11) + '•'.repeat(20) + key.substring(key.length - 8)
  }

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics?period=30d')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#eeeeee]">
        <div className="animate-pulse text-[#5C5855] font-mono">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#eeeeee] py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-[#020202] font-[family-name:var(--font-geist)]">
            API Management
          </h1>
          <p className="text-[#5C5855] mt-2 font-mono text-sm">
            API Keys, Webhooks, Analytics & Documentation
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="keys" className="space-y-6">
        {/* Rate Limits Info */}
        <Alert>
          <Code className="h-4 w-4" />
          <AlertDescription>
            <strong>Rate Limits:</strong> {userPlan === 'pro' ? '600 requests/minute' : '120 requests/minute'} • 
            Monthly limit applies to both API usage
          </AlertDescription>
        </Alert>

        {/* API Status */}
        {apiKeys.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                API Status
              </CardTitle>
              <CardDescription>
                Test your API endpoints • Using first API key
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiStatuses.map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {status.status === 'checking' && (
                        <Loader2 className="h-5 w-5 animate-spin text-[#5C5855]" />
                      )}
                      {status.status === 'operational' && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {status.status === 'error' && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium text-[#020202]">{status.endpoint}</p>
                        {status.responseTime && (
                          <p className="text-xs text-[#5C5855]">Response time: {status.responseTime}ms</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={status.status === 'operational' ? 'default' : status.status === 'error' ? 'destructive' : 'secondary'}>
                      {status.status === 'checking' ? 'Checking...' : status.status === 'operational' ? 'Operational' : 'Error'}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => checkApiStatus(apiKeys[0].key)}
                  disabled={apiStatuses[0].status === 'checking'}
                >
                  {apiStatuses[0].status === 'checking' ? 'Testing...' : 'Test Again'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create New Key */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New API Key
            </CardTitle>
            <CardDescription>
              Generate a new API key to access FKbounce programmatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="API Key Name (e.g., Production Server)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !creating) {
                    handleCreateKey()
                  }
                }}
              />
              <Button onClick={handleCreateKey} disabled={creating || !newKeyName.trim()}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Keys List */}
        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>
              {apiKeys.length === 0 
                ? 'No API keys created yet' 
                : `${apiKeys.length} API key${apiKeys.length > 1 ? 's' : ''}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-[#5C5855]">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-mono text-sm">Create your first API key to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-[#020202]">{apiKey.name}</h3>
                        <p className="text-xs text-[#5C5855] font-mono mt-1">
                          Created {new Date(apiKey.created_at).toLocaleDateString()}
                          {apiKey.last_used_at && ` • Last used ${new Date(apiKey.last_used_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKey(apiKey.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-[#f5f5f5] px-3 py-2 rounded font-mono text-sm">
                        {showKey === apiKey.key ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowKey(showKey === apiKey.key ? null : apiKey.key)}
                      >
                        {showKey === apiKey.key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(apiKey.key)}
                      >
                        {copiedKey === apiKey.key ? (
                          <span className="text-green-600">Copied!</span>
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-6">
            <WebhookManager />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {analytics && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Plan Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.plan.usage_percentage}%</div>
                      <p className="text-xs text-[#5C5855] mt-1">
                        {analytics.plan.verifications_used.toLocaleString()} / {analytics.plan.verifications_limit.toLocaleString()} verifications
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Valid Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{analytics.summary.valid_rate}%</div>
                      <p className="text-xs text-[#5C5855] mt-1">
                        {analytics.summary.total_valid.toLocaleString()} of {analytics.summary.total_verifications.toLocaleString()} emails
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.summary.total_verifications.toLocaleString()}</div>
                      <p className="text-xs text-[#5C5855] mt-1">
                        Last 30 days
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#5C5855]">Single Verifications:</span>
                          <span className="font-semibold">{analytics.summary.single_verifications}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#5C5855]">Bulk Verifications:</span>
                          <span className="font-semibold">{analytics.summary.bulk_verifications}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#5C5855]">Active API Keys:</span>
                          <span className="font-semibold">{analytics.summary.active_api_keys}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#5C5855]">Active Webhooks:</span>
                          <span className="font-semibold">{analytics.summary.active_webhooks}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-6">

        {/* API Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              API Documentation
            </CardTitle>
            <CardDescription>
              Complete guide to integrate FKBounce email verification into your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="authentication">
                <AccordionTrigger>Authentication</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-[#5C5855] mb-3">Include your API key in the request header:</p>
                  <CodeBlock 
                    code="Authorization: Bearer YOUR_API_KEY"
                    language="http"
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="endpoints">
                <AccordionTrigger>API Endpoints</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Single Email Verification</h4>
                    <CodeBlock 
                      code={`POST https://www.fkbounce.com/api/verify-with-key
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "email": "user@example.com"
}`}
                      language="http"
                      title="Single Email Endpoint"
                    />
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Bulk Email Verification (up to 1000)</h4>
                    <CodeBlock 
                      code={`POST https://www.fkbounce.com/api/verify-bulk-with-key
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "emails": ["user1@example.com", "user2@example.com"]
}`}
                      language="http"
                      title="Bulk Email Endpoint"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="response">
                <AccordionTrigger>Response Format</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-[#5C5855] mb-3">Single email response:</p>
                  <CodeBlock 
                    code={`{
  "email": "user@example.com",
  "valid": true,
  "syntax": true,
  "dns": true,
  "smtp": true,
  "disposable": false,
  "message": "Email is valid"
}`}
                    language="json"
                    title="Single Response"
                  />
                  <p className="text-sm text-[#5C5855] mb-3 mt-4">Bulk verification response:</p>
                  <CodeBlock 
                    code={`{
  "total": 2,
  "valid": 1,
  "invalid": 1,
  "results": [
    { "email": "user1@example.com", "valid": true, ... },
    { "email": "user2@example.com", "valid": false, ... }
  ]
}`}
                    language="json"
                    title="Bulk Response"
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="curl">
                <AccordionTrigger>cURL Examples</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Single Email</h4>
                    <CodeBlock 
                      code={`curl -X POST https://www.fkbounce.com/api/verify-with-key \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com"}'`}
                      language="bash"
                      title="cURL - Single Email"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Bulk Emails</h4>
                    <CodeBlock 
                      code={`curl -X POST https://www.fkbounce.com/api/verify-bulk-with-key \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"emails":["user1@example.com","user2@example.com"]}'`}
                      language="bash"
                      title="cURL - Bulk Emails"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="javascript">
                <AccordionTrigger>JavaScript / Node.js</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Single Email</h4>
                    <CodeBlock 
                      code={`const response = await fetch('https://www.fkbounce.com/api/verify-with-key', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email: 'user@example.com' })
})
const result = await response.json()
console.log(result)`}
                      language="javascript"
                      title="JavaScript - Single Email"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Bulk Emails</h4>
                    <CodeBlock 
                      code={`const response = await fetch('https://www.fkbounce.com/api/verify-bulk-with-key', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ 
    emails: ['user1@example.com', 'user2@example.com'] 
  })
})
const result = await response.json()
console.log(result.total, result.valid, result.invalid)`}
                      language="javascript"
                      title="JavaScript - Bulk Emails"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="python">
                <AccordionTrigger>Python</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Single Email</h4>
                    <CodeBlock 
                      code={`import requests

response = requests.post(
  'https://www.fkbounce.com/api/verify-with-key',
  headers={'Authorization': 'Bearer YOUR_API_KEY'},
  json={'email': 'user@example.com'}
)
result = response.json()
print(result)`}
                      language="python"
                      title="Python - Single Email"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Bulk Emails</h4>
                    <CodeBlock 
                      code={`import requests

response = requests.post(
  'https://www.fkbounce.com/api/verify-bulk-with-key',
  headers={'Authorization': 'Bearer YOUR_API_KEY'},
  json={'emails': ['user1@example.com', 'user2@example.com']}
)
result = response.json()
print(f"Total: {result['total']}, Valid: {result['valid']}")`}
                      language="python"
                      title="Python - Bulk Emails"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="php">
                <AccordionTrigger>PHP</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Single Email</h4>
                    <CodeBlock 
                      code={`$ch = curl_init('https://www.fkbounce.com/api/verify-with-key');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Authorization: Bearer YOUR_API_KEY',
  'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  'email' => 'user@example.com'
]));
$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);`}
                      language="php"
                      title="PHP - Single Email"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Bulk Emails</h4>
                    <CodeBlock 
                      code={`$ch = curl_init('https://www.fkbounce.com/api/verify-bulk-with-key');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Authorization: Bearer YOUR_API_KEY',
  'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  'emails' => ['user1@example.com', 'user2@example.com']
]));
$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);`}
                      language="php"
                      title="PHP - Bulk Emails"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="rate-limits">
                <AccordionTrigger>Rate Limits & Headers</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p className="text-sm text-[#5C5855]">
                      All API responses include rate limit information in headers:
                    </p>
                    <code className="block bg-[#f5f5f5] p-3 rounded font-mono text-xs">
                      X-RateLimit-Limit: 120<br/>
                      X-RateLimit-Remaining: 119<br/>
                      X-RateLimit-Reset: 1732234567
                    </code>
                    <div className="mt-3">
                      <p className="text-sm font-semibold mb-1">Free Plan:</p>
                      <p className="text-sm text-[#5C5855]">120 requests/minute, 500 verifications/month</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Pro Plan:</p>
                      <p className="text-sm text-[#5C5855]">600 requests/minute, 1,000,000 verifications/month</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="webhooks">
                <AccordionTrigger>Webhooks</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <p className="text-sm text-[#5C5855]">
                    Receive real-time notifications when bulk verification jobs complete.
                  </p>
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Setup</h4>
                    <p className="text-xs text-[#5C5855] mb-2">
                      1. Create a webhook in the Webhooks tab<br/>
                      2. Save the secret key securely<br/>
                      3. Configure your server to receive POST requests
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Webhook Payload</h4>
                    <CodeBlock 
                      code={`{
  "event": "bulk_verification_complete",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-11-23T10:30:00.000Z",
  "data": {
    "total": 1000,
    "unique": 950,
    "valid": 750,
    "invalid": 200,
    "duplicates": 50
  }
}`}
                      language="json"
                      title="Webhook Payload"
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Webhook Headers</h4>
                    <CodeBlock 
                      code={`X-Webhook-Signature: sha256=abc123...
X-Webhook-Event: bulk_verification_complete
Content-Type: application/json
User-Agent: FKbounce-Webhook/1.0`}
                      language="http"
                      title="Request Headers"
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Verify Webhook Signature (Node.js)</h4>
                    <CodeBlock 
                      code={`const crypto = require('crypto')

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')
  
  return signature === expectedSignature
}

// Express.js example
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature']
  const isValid = verifyWebhook(req.body, signature, YOUR_SECRET)
  
  if (!isValid) {
    return res.status(401).send('Invalid signature')
  }
  
  // Process webhook
  const { event, job_id, data } = req.body
  console.log(\`Job \${job_id} completed: \${data.valid} valid emails\`)
  
  res.status(200).send('OK')
})`}
                      language="javascript"
                      title="Node.js - Webhook Verification"
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Verify Webhook Signature (Python)</h4>
                    <CodeBlock 
                      code={`import hmac
import hashlib
import json

def verify_webhook(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode(),
        json.dumps(payload).encode(),
        hashlib.sha256
    ).hexdigest()
    return signature == expected_signature

# Flask example
@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    payload = request.json
    
    if not verify_webhook(payload, signature, YOUR_SECRET):
        return 'Invalid signature', 401
    
    # Process webhook
    event = payload['event']
    job_id = payload['job_id']
    data = payload['data']
    print(f"Job {job_id} completed: {data['valid']} valid emails")
    
    return 'OK', 200`}
                      language="python"
                      title="Python - Webhook Verification"
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Retry Policy</h4>
                    <p className="text-xs text-[#5C5855]">
                      • Webhooks are retried up to 3 times with exponential backoff<br/>
                      • Delays: 1s, 2s, 4s between retries<br/>
                      • 10-second timeout per request<br/>
                      • Your endpoint should return 2xx status code
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="job-status">
                <AccordionTrigger>Job Status Tracking</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <p className="text-sm text-[#5C5855]">
                    Track the progress of bulk verification jobs in real-time.
                  </p>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Get Job Status</h4>
                    <CodeBlock 
                      code={`GET /api/verify-bulk-job/{jobId}
Authorization: Bearer YOUR_API_KEY`}
                      language="http"
                      title="Job Status Endpoint"
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Response</h4>
                    <CodeBlock 
                      code={`{
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "total_emails": 1000,
    "processed_emails": 450,
    "valid_count": 350,
    "invalid_count": 100,
    "progress_percentage": 45,
    "created_at": "2025-11-23T10:00:00.000Z",
    "updated_at": "2025-11-23T10:05:00.000Z",
    "completed_at": null,
    "estimated_time_remaining": 180
  },
  "results": null
}`}
                      language="json"
                      title="Job Status Response"
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Job Statuses</h4>
                    <p className="text-xs text-[#5C5855]">
                      • <strong>pending</strong> - Job queued, not started<br/>
                      • <strong>processing</strong> - Currently verifying emails<br/>
                      • <strong>completed</strong> - All emails verified<br/>
                      • <strong>failed</strong> - Job encountered an error
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Poll for Completion (JavaScript)</h4>
                    <CodeBlock 
                      code={`async function pollJobStatus(jobId) {
  const maxAttempts = 60
  const pollInterval = 5000 // 5 seconds
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      \`/api/verify-bulk-job/\${jobId}\`,
      { headers: { 'Authorization': 'Bearer YOUR_API_KEY' } }
    )
    const data = await response.json()
    
    console.log(\`Progress: \${data.job.progress_percentage}%\`)
    
    if (data.job.status === 'completed') {
      console.log('Job completed!', data.results)
      return data.results
    }
    
    if (data.job.status === 'failed') {
      throw new Error(data.job.error_message)
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }
  
  throw new Error('Job timeout')
}`}
                      language="javascript"
                      title="JavaScript - Poll Job Status"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
