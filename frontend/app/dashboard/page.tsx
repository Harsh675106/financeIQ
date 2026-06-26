'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import FinancialOverview from '@/components/dashboard/FinancialOverview'
import RiskAssessment from '@/components/dashboard/RiskAssessment'
import QuickActions from '@/components/dashboard/QuickActions'
import PortfolioAllocation from '@/components/dashboard/PortfolioAllocation'
import InsightsCard from '@/components/dashboard/InsightsCard'
import NetWorthTrend from '@/components/dashboard/NetWorthTrend'
import AlertsRecommendations from '@/components/dashboard/AlertsRecommendations'
import FinanceCopilotCard from '@/components/dashboard/FinanceCopilotCard'
import PageBackground from '@/components/layouts/PageBackground'

export default function DashboardPage() {
  const { user, loading, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.replace('/')
    }
  }, [user, loading, initialized, router])

  if (!initialized || loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="relative">
             <div className="h-16 w-16 rounded-full border-4 border-slate-800"></div>
             <div className="absolute top-0 h-16 w-16 rounded-full border-t-4 border-primary-500 animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-400 text-sm">Loading your Financial Workspace...</p>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageBackground variant="aurora" />
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-50">Dashboard</h1>
            <p className="text-slate-400 mt-1">
              Welcome back, {user.name || user.email}
            </p>
          </div>
        </div>

        <FinancialOverview />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <InsightsCard />
          <NetWorthTrend />
          <AlertsRecommendations />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiskAssessment />
          <QuickActions />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <FinanceCopilotCard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PortfolioAllocation />
        </div>
      </div>
    </DashboardLayout>
  )
}
