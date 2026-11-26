'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useIndiaGreeting } from '@/hooks/useIndiaGreeting'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import FinancialOverview from '@/components/dashboard/FinancialOverview'
import RiskAssessment from '@/components/dashboard/RiskAssessment'
import QuickActions from '@/components/dashboard/QuickActions'
import PortfolioAllocation from '@/components/dashboard/PortfolioAllocation'
import InsightsCard from '@/components/dashboard/InsightsCard'
import NetWorthTrend from '@/components/dashboard/NetWorthTrend'
import AlertsRecommendations from '@/components/dashboard/AlertsRecommendations'
import PageBackground from '@/components/layouts/PageBackground'
import PageHeader from '@/components/ui/PageHeader'
import LoadingScreen from '@/components/ui/LoadingScreen'
import Reveal from '@/components/motion/Reveal'
import { Sparkles, Calendar, Sun, Sunrise, Sunset, Moon } from 'lucide-react'

export default function DashboardPage() {
  const { user, loading, initialized } = useAuth()
  const router = useRouter()
  const { greeting, subtext, period, formattedDate, formattedTime } = useIndiaGreeting()

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.replace('/')
    }
  }, [user, loading, initialized, router])

  if (!initialized || loading || !user) {
    return <LoadingScreen label="Loading your Financial Workspace..." />
  }

  const TimeIcon =
    period === 'morning'
      ? Sunrise
      : period === 'afternoon'
      ? Sun
      : period === 'evening'
      ? Sunset
      : Moon

  return (
    <DashboardLayout>
      <PageBackground variant="aurora" />
      <div className="relative z-10 space-y-6 lg:space-y-8">
        {/* Dynamic Interactive Header */}
        <PageHeader
          eyebrow="Intelligence Hub"
          eyebrowIcon={Sparkles}
          eyebrowTone="brand"
          meta={
            <>
              <span className="badge badge-neutral">
                <Calendar className="h-3 w-3 text-slate-400" aria-hidden="true" />
                {formattedDate}
              </span>
              <span className="badge badge-info num">
                <TimeIcon className="h-3 w-3" aria-hidden="true" />
                <span>{formattedTime} IST</span>
              </span>
            </>
          }
          title={
            <>
              {greeting},{' '}
              <span className="text-gradient">{user.name || user.email?.split('@')[0]}</span>
            </>
          }
          description={subtext}
        />

        {/* Primary KPI & Health Score Cards */}
        <Reveal variant="rise">
          <FinancialOverview />
        </Reveal>

        {/* Middle Tier: Net Worth Chart, Insights, and Recommendations.
            lg–xl: chart spans the full row first, insights + actions share the next row.
            2xl: all three sit side by side in their original order. */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          <Reveal className="min-w-0" delay={60}>
            <InsightsCard />
          </Reveal>
          <Reveal
            className="min-w-0 lg:order-first lg:col-span-2 2xl:order-none 2xl:col-span-1"
            variant="rise"
          >
            <NetWorthTrend />
          </Reveal>
          <Reveal className="min-w-0" delay={120}>
            <AlertsRecommendations />
          </Reveal>
        </div>

        {/* Lower Tier: Risk Assessment & Quick Actions */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <Reveal className="min-w-0" variant="flip">
            <RiskAssessment />
          </Reveal>
          <Reveal className="min-w-0" variant="flip" delay={90}>
            <QuickActions />
          </Reveal>
        </div>

        {/* Bottom Tier: Portfolio Allocation & Asset Distribution (full width, split layout inside) */}
        <Reveal>
          <PortfolioAllocation />
        </Reveal>
      </div>
    </DashboardLayout>
  )
}
