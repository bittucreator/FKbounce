'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface VerificationResult {
  email: string
  valid: boolean
  syntax: boolean
  dns: boolean
  smtp: boolean
  disposable: boolean
  message: string
}

interface VerificationResultsTableProps {
  results: VerificationResult[]
}

export default function VerificationResultsTable({ results }: VerificationResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25
  const totalPages = Math.ceil(results.length / itemsPerPage)
  
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentResults = results.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="rounded-[12px] border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Email</TableHead>
            <TableHead className="text-left">Status</TableHead>
            <TableHead className="text-left">Syntax</TableHead>
            <TableHead className="text-left">DNS</TableHead>
            <TableHead className="text-left">SMTP</TableHead>
            <TableHead className="text-left">Disposable</TableHead>
            <TableHead className="text-left">Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentResults.map((result, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-mono text-sm text-left">{result.email}</TableCell>
              <TableCell className="text-left">
                <Badge variant={result.valid ? 'default' : 'destructive'}>
                  {result.valid ? 'Valid' : 'Invalid'}
                </Badge>
              </TableCell>
              <TableCell className="text-left">
                <Badge variant={result.syntax ? 'default' : 'secondary'}>
                  {result.syntax ? '✓' : '✗'}
                </Badge>
              </TableCell>
              <TableCell className="text-left">
                <Badge variant={result.dns ? 'default' : 'secondary'}>
                  {result.dns ? '✓' : '✗'}
                </Badge>
              </TableCell>
              <TableCell className="text-left">
                <Badge variant={result.smtp ? 'default' : 'secondary'}>
                  {result.smtp ? '✓' : '✗'}
                </Badge>
              </TableCell>
              <TableCell className="text-left">
                <Badge variant={result.disposable ? 'destructive' : 'secondary'}>
                  {result.disposable ? 'Yes' : 'No'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground text-left">{result.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {results.length > itemsPerPage && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} - {Math.min(endIndex, results.length)} of {results.length} results
            </p>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
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

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
