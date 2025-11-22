'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import { ArrowLeft, Key, Copy, Eye, EyeOff, Trash2, Plus, Code, Book } from 'lucide-react'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion'

interface ApiKey {
  id: string
  name: string
  key: string
  created_at: string
  last_used_at: string | null
}

export default function ApiKeysPage() {
  const [loading, setLoading] = useState(true)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showKey, setShowKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<string>('free')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadApiKeys()
  }, [])

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
            API Keys
          </h1>
          <p className="text-[#5C5855] mt-2 font-mono text-sm">
            Create and manage API keys for programmatic access
          </p>
        </div>

        {/* Rate Limits Info */}
        <Alert>
          <Code className="h-4 w-4" />
          <AlertDescription>
            <strong>Rate Limits:</strong> {userPlan === 'pro' ? '600 requests/minute' : '120 requests/minute'} • 
            Monthly limit applies to both API usage
          </AlertDescription>
        </Alert>

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
                  <code className="block bg-[#f5f5f5] p-3 rounded font-mono text-sm">
                    Authorization: Bearer YOUR_API_KEY
                  </code>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="endpoints">
                <AccordionTrigger>API Endpoints</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Single Email Verification</h4>
                    <code className="block bg-[#f5f5f5] p-3 rounded font-mono text-xs whitespace-pre">
{`POST https://www.fkbounce.com/api/verify-with-key
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "email": "user@example.com"
}`}
                    </code>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Bulk Email Verification (up to 1000)</h4>
                    <code className="block bg-[#f5f5f5] p-3 rounded font-mono text-xs whitespace-pre">
{`POST https://www.fkbounce.com/api/verify-bulk-with-key
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "emails": ["user1@example.com", "user2@example.com"]
}`}
                    </code>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="response">
                <AccordionTrigger>Response Format</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-[#5C5855] mb-3">Single email response:</p>
                  <code className="block bg-[#f5f5f5] p-3 rounded font-mono text-xs whitespace-pre">
{`{
  "email": "user@example.com",
  "valid": true,
  "syntax": true,
  "dns": true,
  "smtp": true,
  "disposable": false,
  "message": "Email is valid"
}`}
                  </code>
                  <p className="text-sm text-[#5C5855] mb-3 mt-4">Bulk verification response:</p>
                  <code className="block bg-[#f5f5f5] p-3 rounded font-mono text-xs whitespace-pre">
{`{
  "total": 2,
  "valid": 1,
  "invalid": 1,
  "results": [
    { "email": "user1@example.com", "valid": true, ... },
    { "email": "user2@example.com", "valid": false, ... }
  ]
}`}
                  </code>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="curl">
                <AccordionTrigger>cURL Examples</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Single Email</h4>
                    <code className="block bg-[#f5f5f5] p-3 rounded font-mono text-xs whitespace-pre">
{`curl -X POST https://www.fkbounce.com/api/verify-with-key \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com"}'`}
                    </code>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Bulk Emails</h4>
                    <code className="block bg-[#f5f5f5] p-3 rounded font-mono text-xs whitespace-pre">
{`curl -X POST https://www.fkbounce.com/api/verify-bulk-with-key \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"emails":["user1@example.com","user2@example.com"]}'`}
                    </code>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="javascript">
                <AccordionTrigger>JavaScript / Node.js</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Single Email</h4>
                    <code className="block bg-[#f5f5f5] p-3 rounded font-mono text-xs whitespace-pre">
{`const response = await fetch('https://www.fkbounce.com/api/verify-with-key', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email: 'user@example.com' })
})
const result = await response.json()
console.log(result)`}
                    </code>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Bulk Emails</h4>
                    <code className="block bg-[#f5f5f5] p-3 rounded font-mono text-xs whitespace-pre">
{`const response = await fetch('https://www.fkbounce.com/api/verify-bulk-with-key', {
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
                    </code>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="python">
                <AccordionTrigger>Python</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Single Email</h4>
                    <code className="block bg-[#f5f5f5] p-3 rounded font-mono text-xs whitespace-pre">
{`import requests

response = requests.post(
  'https://www.fkbounce.com/api/verify-with-key',
  headers={'Authorization': 'Bearer YOUR_API_KEY'},
  json={'email': 'user@example.com'}
)
result = response.json()
print(result)`}
                    </code>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Bulk Emails</h4>
                    <code className="block bg-[#f5f5f5] p-3 rounded font-mono text-xs whitespace-pre">
{`import requests

response = requests.post(
  'https://www.fkbounce.com/api/verify-bulk-with-key',
  headers={'Authorization': 'Bearer YOUR_API_KEY'},
  json={'emails': ['user1@example.com', 'user2@example.com']}
)
result = response.json()
print(f"Total: {result['total']}, Valid: {result['valid']}")`}
                    </code>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="php">
                <AccordionTrigger>PHP</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Single Email</h4>
                    <code className="block bg-[#f5f5f5] p-3 rounded font-mono text-xs whitespace-pre">
{`$ch = curl_init('https://www.fkbounce.com/api/verify-with-key');
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
                    </code>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Bulk Emails</h4>
                    <code className="block bg-[#f5f5f5] p-3 rounded font-mono text-xs whitespace-pre">
{`$ch = curl_init('https://www.fkbounce.com/api/verify-bulk-with-key');
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
                    </code>
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
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
