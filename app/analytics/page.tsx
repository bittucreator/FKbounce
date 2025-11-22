'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { ArrowLeft, TrendingUp, CheckCircle, XCircle, Mail, Calendar } from 'lucide-react'
import { format, subDays, startOfDay } from 'date-fns'

interface DailyStats {
  date: string
  total: number
  valid: number
  invalid: number
  successRate: number
}

interface VerificationHistory {
  created_at: string
  verification_type: string
  email_count: number
  valid_count: number
  invalid_count: number
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [totalStats, setTotalStats] = useState({
    totalVerifications: 0,
    totalValid: 0,
    totalInvalid: 0,
    averageSuccessRate: 0,
    singleVerifications: 0,
    bulkVerifications: 0
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/')
      return
    }

    // Fetch verification history for last 30 days
    const thirtyDaysAgo = subDays(new Date(), 30)
    const { data: history } = await supabase
      .from('verification_history')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    if (history) {
      processAnalytics(history)
    }

    setLoading(false)
  }

  const processAnalytics = (history: VerificationHistory[]) => {
    // Calculate daily stats for last 30 days
    const dailyMap = new Map<string, { total: number; valid: number; invalid: number }>()
    
    // Initialize all days in the last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
      dailyMap.set(date, { total: 0, valid: 0, invalid: 0 })
    }

    // Aggregate data by day
    let totalVerifications = 0
    let totalValid = 0
    let totalInvalid = 0
    let singleCount = 0
    let bulkCount = 0

    history.forEach(record => {
      const date = format(new Date(record.created_at), 'yyyy-MM-dd')
      const stats = dailyMap.get(date)
      
      if (stats) {
        stats.total += record.email_count
        stats.valid += record.valid_count
        stats.invalid += record.invalid_count
      }

      totalVerifications += record.email_count
      totalValid += record.valid_count
      totalInvalid += record.invalid_count
      
      if (record.verification_type === 'single') {
        singleCount++
      } else {
        bulkCount++
      }
    })

    // Convert to array and calculate success rates
    const dailyData: DailyStats[] = Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      total: stats.total,
      valid: stats.valid,
      invalid: stats.invalid,
      successRate: stats.total > 0 ? (stats.valid / stats.total) * 100 : 0
    }))

    setDailyStats(dailyData)
    setTotalStats({
      totalVerifications,
      totalValid,
      totalInvalid,
      averageSuccessRate: totalVerifications > 0 ? (totalValid / totalVerifications) * 100 : 0,
      singleVerifications: singleCount,
      bulkVerifications: bulkCount
    })
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#eeeeee]">
        <div className="animate-pulse text-[#5C5855] font-mono">Loading analytics...</div>
      </main>
    )
  }

  const maxDaily = Math.max(...dailyStats.map(d => d.total), 1)

  return (
    <main className="min-h-screen bg-[#eeeeee] py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
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
            Usage Analytics
          </h1>
          <p className="text-[#5C5855] mt-2 font-mono text-sm">
            Track your email verification trends and success rates
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#5C5855]">Total Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#5C5855]" />
                <span className="text-2xl font-bold">{totalStats.totalVerifications.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#5C5855]">Valid Emails</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{totalStats.totalValid.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#5C5855]">Invalid Emails</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-2xl font-bold text-red-600">{totalStats.totalInvalid.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#5C5855]">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{totalStats.averageSuccessRate.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Verification Volume */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Verification Volume</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dailyStats.slice(-14).map((day) => (
                  <div key={day.date} className="flex items-center gap-3">
                    <div className="text-xs text-[#5C5855] w-20 font-mono">
                      {format(new Date(day.date), 'MMM dd')}
                    </div>
                    <div className="flex-1 h-8 bg-[#f5f5f5] rounded overflow-hidden">
                      {day.total > 0 && (
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end pr-2"
                          style={{ width: `${(day.total / maxDaily) * 100}%` }}
                        >
                          <span className="text-xs text-white font-medium">{day.total}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Success Rate Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Success Rate Trend</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dailyStats.slice(-14).map((day) => (
                  <div key={day.date} className="flex items-center gap-3">
                    <div className="text-xs text-[#5C5855] w-20 font-mono">
                      {format(new Date(day.date), 'MMM dd')}
                    </div>
                    <div className="flex-1 h-8 bg-[#f5f5f5] rounded overflow-hidden">
                      {day.total > 0 && (
                        <div
                          className={`h-full flex items-center justify-end pr-2 ${
                            day.successRate >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                            day.successRate >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            'bg-gradient-to-r from-red-500 to-red-600'
                          }`}
                          style={{ width: `${day.successRate}%` }}
                        >
                          <span className="text-xs text-white font-medium">{day.successRate.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verification Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Type Breakdown</CardTitle>
            <CardDescription>Distribution of single vs bulk verifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-[#5C5855] mb-2">Single Verifications</div>
                <div className="text-3xl font-bold">{totalStats.singleVerifications}</div>
                <div className="text-xs text-[#5C5855] mt-1">
                  {totalStats.totalVerifications > 0 
                    ? ((totalStats.singleVerifications / (totalStats.singleVerifications + totalStats.bulkVerifications)) * 100).toFixed(1)
                    : 0}% of total jobs
                </div>
              </div>
              <div>
                <div className="text-sm text-[#5C5855] mb-2">Bulk Verifications</div>
                <div className="text-3xl font-bold">{totalStats.bulkVerifications}</div>
                <div className="text-xs text-[#5C5855] mt-1">
                  {totalStats.totalVerifications > 0 
                    ? ((totalStats.bulkVerifications / (totalStats.singleVerifications + totalStats.bulkVerifications)) * 100).toFixed(1)
                    : 0}% of total jobs
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
