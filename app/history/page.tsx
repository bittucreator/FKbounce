import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'

interface VerificationHistoryItem {
  id: string
  verification_type: 'single' | 'bulk'
  email_count: number
  valid_count: number
  invalid_count: number
  created_at: string
  results: any[]
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: history, error } = await supabase
    .from('verification_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching history:', error)
  }

  const historyItems = (history || []) as VerificationHistoryItem[]

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#020202] mb-2">Verification History</h1>
        <p className="text-[#5C5855] font-mono">View your past email verification results</p>
      </div>

      {historyItems.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No verification history yet. Start verifying emails!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {historyItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#020202]">
                      {item.verification_type === 'single' ? 'Single Email Verification' : 'Bulk Email Verification'}
                    </CardTitle>
                    <CardDescription className="text-[#5C5855] font-mono">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {item.valid_count} Valid
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {item.invalid_count} Invalid
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Syntax</TableHead>
                        <TableHead>DNS</TableHead>
                        <TableHead>SMTP</TableHead>
                        <TableHead>Disposable</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {item.results.slice(0, 10).map((result: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-sm">{result.email}</TableCell>
                          <TableCell>
                            <Badge variant={result.valid ? 'default' : 'destructive'}>
                              {result.valid ? 'Valid' : 'Invalid'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={result.syntax ? 'default' : 'secondary'}>
                              {result.syntax ? '✓' : '✗'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={result.dns ? 'default' : 'secondary'}>
                              {result.dns ? '✓' : '✗'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={result.smtp ? 'default' : 'secondary'}>
                              {result.smtp ? '✓' : '✗'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={result.disposable ? 'destructive' : 'secondary'}>
                              {result.disposable ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{result.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {item.results.length > 10 && (
                    <div className="p-4 text-center text-sm text-muted-foreground border-t">
                      Showing 10 of {item.results.length} results
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
