'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Switch } from '../components/ui/switch'
import { Check, Sparkles, Zap } from 'lucide-react'

interface PricingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlan?: 'free' | 'pro'
}

export default function PricingModal({ open, onOpenChange, currentPlan = 'free' }: PricingModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      yearlyPrice: 0,
      description: 'Perfect for testing and personal use',
      icon: Sparkles,
      features: [
        '500 verifications/month',
        'Single & bulk email verification',
        'Basic verification (syntax, DNS, disposable)',
        'CSV upload support',
        'Verification history (7 days)',
      ],
      cta: currentPlan === 'free' ? 'Current Plan' : 'Downgrade',
      highlighted: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 15,
      yearlyPrice: 120,
      description: 'For professionals and businesses',
      icon: Zap,
      features: [
        '1M verifications/month',
        'Single & bulk email verification',
        'Full verification (syntax, DNS, SMTP, disposable)',
        'CSV upload support',
        'Verification history (30 days)',
        'Export results (CSV, JSON, Excel)',
        'Priority support',
      ],
      cta: currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      highlighted: true,
    },
  ]

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') {
      // TODO: Handle downgrade logic if needed
      return
    }

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, billingCycle }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { checkoutUrl } = await response.json()
      
      // Redirect to Dodo Payments checkout
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Error creating checkout:', error)
      alert('Failed to start checkout process. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Choose Your Plan</DialogTitle>
          <DialogDescription className="text-center">
            Select the perfect plan for your email verification needs
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 my-4">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <Switch
            checked={billingCycle === 'yearly'}
            onCheckedChange={(checked: boolean) => setBillingCycle(checked ? 'yearly' : 'monthly')}
          />
          <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Yearly
          </span>
          <Badge className="bg-green-500 text-white text-xs ml-1">33% OFF</Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {plans.map((plan) => {
            const Icon = plan.icon
            const price = billingCycle === 'monthly' ? plan.price : plan.yearlyPrice
            const isCurrentPlan = currentPlan === plan.id
            
            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.highlighted
                    ? 'border-primary shadow-lg ring-2 ring-primary'
                    : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  <div className="mt-3">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold">${price}</span>
                      {plan.id !== 'free' && (
                        <span className="text-sm text-muted-foreground">
                          /{billingCycle === 'monthly' ? 'mo' : 'yearly'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'yearly' && plan.id !== 'free' && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pb-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-xs">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-0">
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrentPlan}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          All plans include email support. Cancel anytime, no questions asked.
        </p>
      </DialogContent>
    </Dialog>
  )
}
