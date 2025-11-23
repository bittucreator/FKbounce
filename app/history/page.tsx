'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import VerificationResultsTable from '@/components/VerificationResultsTable'
import AppBreadcrumb from '@/components/AppBreadcrumb'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
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

export default function HistoryPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<VerificationHistoryItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 100
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
      fetchHistory(1)
    }

    getUser()
  }, [])

  const fetchHistory = async (page: number) => {
    setLoading(true)
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    // Get total count
    const { count } = await supabase
      .from('verification_history')
      .select('*', { count: 'exact', head: true })

    setTotalCount(count || 0)

    // Get paginated data
    const { data, error } = await supabase
      .from('verification_history')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching history:', error)
    } else {
      setHistory((data || []) as VerificationHistoryItem[])
    }

    setLoading(false)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchHistory(page)
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const showPagination = totalCount > itemsPerPage

  if (loading && !user) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="animate-pulse text-[#5C5855] font-mono">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <header className="border-b bg-[#eeeeee]">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/Logo-dark.svg" alt="FKbounce" className="h-7 w-auto" />
            </button>
            <div className="ml-4">
              <AppBreadcrumb />
            </div>
          </div>
        </div>
      </header>

      <div className="container text-center mx-auto py-10 px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#020202] mb-2">Verification History</h2>
          <p className="text-[#5C5855] font-mono">
            View your past email verification results ({totalCount} total)
          </p>
        </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No verification history yet. Start verifying emails!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-6">
            {history.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-left space-y-2">
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
                <VerificationResultsTable results={item.results} />
              </CardContent>
            </Card>
          ))}
          </div>

          {showPagination && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNumber
                    if (totalPages <= 5) {
                      pageNumber = i + 1
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i
                    } else {
                      pageNumber = currentPage - 2 + i
                    }

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNumber)}
                          isActive={currentPage === pageNumber}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
      </div>
    </>
  )
}
