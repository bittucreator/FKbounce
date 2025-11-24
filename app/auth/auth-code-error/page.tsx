'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'

export default function AuthCodeErrorPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <CardTitle>Authentication Error</CardTitle>
          </div>
          <CardDescription>
            We couldn't complete the sign-in process. This might be due to:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
            <li><strong>Google OAuth is not configured</strong> in the Supabase project (most common)</li>
            <li>Missing Client ID or Client Secret in Supabase dashboard</li>
            <li>Redirect URI mismatch in Google Cloud Console</li>
            <li>Invalid authorization code or expired session</li>
          </ul>

          <div className="pt-4 space-y-2">
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
              variant="default"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>For administrators:</strong> Check the <code className="bg-muted px-1 py-0.5 rounded">GOOGLE_AUTH_FIX.md</code> file for configuration instructions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
