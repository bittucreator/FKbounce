'use client'

import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Sparkles } from 'lucide-react'
import PricingModal from '../components/PricingModal'

interface UpgradeButtonProps {
  currentPlan?: 'free' | 'pro'
}

export default function UpgradeButton({ currentPlan = 'free' }: UpgradeButtonProps) {
  const [showPricing, setShowPricing] = useState(false)

  if (currentPlan === 'pro') {
    return null // Don't show upgrade button for pro users
  }

  return (
    <>
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowPricing(true)}
      className="gap-2 align-middle w-20 h-8 bg-[#eeeeee] border border-[#cccccc] text-black hover:bg-white/90 font-mono"
    >
      Upgrade
    </Button>
      
      <PricingModal
        open={showPricing}
        onOpenChange={setShowPricing}
        currentPlan={currentPlan}
      />
    </>
  )
}
