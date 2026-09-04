'use client'

import { useEffect, useState } from 'react'
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
import PageBackground from '@/components/layouts/PageBackground'
import { Sparkles, Calendar, ShieldCheck, ArrowUpRight } from 'lucide-react'

export default function DashboardPage() {
  const { user, loading, initialized } = useAuth()
  const router = useRouter()
  const [greeting, setGreeting] = useState('Welcome back')

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.replace('/')
    }
  }, [user, loading, initialized, router])

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  if (!initialized || loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-800"></div>
          <div className="absolute top-0 h-16 w-16 rounded-full border-t-4 border-primary-500 animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-400 text-sm animate-pulse">Loading your Financial Workspace...</p>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageBackground variant="aurora" />
      <div className="relative z-10 space-y-6">
        {/* Dynamic Interactive Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fade-up">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 px-2.5 py-0.5 text-xs font-semibold text-primary-300">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                Intelligence Hub
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">
              {greeting},{' '}
              <span className="bg-gradient-to-r from-primary-300 to-emerald-400 bg-clip-text text-transparent">
                {user.name || user.email?.split('@')[0]}
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Here is your comprehensive real-time wealth analysis and financial health metrics.
            </p>
          </div>
        </div>

        {/* Primary KPI & Health Score Cards */}
        <FinancialOverview />

        {/* Middle Tier: Insights, Net Worth Chart, and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <InsightsCard />
          <NetWorthTrend />
          <AlertsRecommendations />
        </div>

        {/* Lower Tier: Risk Assessment & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RiskAssessment />
          <QuickActions />
        </div>

        {/* Bottom Tier: Portfolio Allocation & Asset Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PortfolioAllocation />
        </div>
      </div>
    </DashboardLayout>
  )
}
