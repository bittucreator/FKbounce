'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import { Calendar, CheckCircle2, CreditCard, AlertCircle, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

interface Subscription {
  dodo_subscription_id: string
  status: string
  plan: string
  billing_cycle: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
}

interface UserPlan {
  plan: string
  verifications_limit: number
  verifications_used: number
  plan_expires_at: string | null
  billing_cycle: string
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadSubscriptionData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/')
        return
      }

      // Fetch subscription data
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (subData) {
        setSubscription(subData)
      }

      // Fetch user plan data
      const { data: planData } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (planData) {
        setUserPlan(planData)
      }

      setLoading(false)
    }

    loadSubscriptionData()
  }, [supabase, router])

  const handleCancelSubscription = async () => {
    if (!subscription?.dodo_subscription_id) return

    setCancelling(true)
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriptionId: subscription.dodo_subscription_id 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      // Refresh subscription data
      window.location.reload()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Failed to cancel subscription. Please try again or contact support.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#eeeeee]">
        <div className="animate-pulse text-[#5C5855] font-mono">Loading...</div>
      </main>
    )
  }

  const isProUser = userPlan?.plan === 'pro'
  const usagePercentage = userPlan ? (userPlan.verifications_used / userPlan.verifications_limit) * 100 : 0

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
            Subscription Management
          </h1>
          <p className="text-[#5C5855] mt-2 font-mono text-sm">
            View and manage your subscription details
          </p>
        </div>

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Plan
                  {isProUser && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-0">
                      PRO
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {isProUser ? 'Professional features unlocked' : 'Free plan with basic features'}
                </CardDescription>
              </div>
              {subscription?.status === 'active' && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Usage Stats */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#5C5855] font-mono">Verifications Used</span>
                <span className="font-semibold">
                  {userPlan?.verifications_used.toLocaleString()} / {userPlan?.verifications_limit.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-[#ececec] rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>

            <Separator />

            {/* Plan Details */}
            {subscription && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#5C5855] text-sm font-mono">
                    <Calendar className="h-4 w-4" />
                    Billing Cycle
                  </div>
                  <p className="font-semibold capitalize">{subscription.billing_cycle}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#5C5855] text-sm font-mono">
                    <CreditCard className="h-4 w-4" />
                    Next Billing Date
                  </div>
                  <p className="font-semibold">
                    {format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-[#5C5855] text-sm font-mono">Plan Started</div>
                  <p className="font-semibold">
                    {format(new Date(subscription.current_period_start), 'MMM dd, yyyy')}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-[#5C5855] text-sm font-mono">Subscription ID</div>
                  <p className="font-mono text-xs text-[#5C5855]">
                    {subscription.dodo_subscription_id}
                  </p>
                </div>
              </div>
            )}

            {/* Cancellation Notice */}
            {subscription?.cancel_at_period_end && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-orange-900">Subscription Cancelled</p>
                    <p className="text-sm text-orange-700 mt-1">
                      Your subscription will end on{' '}
                      <strong>{format(new Date(subscription.current_period_end), 'MMMM dd, yyyy')}</strong>.
                      You'll be downgraded to the free plan after this date.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {isProUser && subscription && !subscription.cancel_at_period_end && (
            <CardFooter className="flex justify-between border-t pt-6">
              <div className="text-sm text-[#5C5855]">
                Need to make changes to your subscription?
              </div>
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
            </CardFooter>
          )}

          {!isProUser && (
            <CardFooter className="flex justify-center border-t pt-6">
              <Button
                onClick={() => router.push('/')}
                className="gap-2"
              >
                Upgrade to Pro
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {isProUser ? (
                <>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    1,000,000 verifications per month
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Full SMTP verification
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    30-day verification history
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Export results (CSV, JSON, Excel)
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Priority support
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    500 verifications per month
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Basic verification (syntax, DNS, disposable)
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    7-day verification history
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    CSV upload support
                  </li>
                </>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
