'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PageBackground from '@/components/layouts/PageBackground'
import PageHeader from '@/components/ui/PageHeader'
import SectionHeader from '@/components/ui/SectionHeader'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { activeDot, axisProps, chartColors, gridProps, tooltipCursor } from '@/lib/chartTheme'
import { api } from '@/lib/api'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { AlertTriangle, BrainCircuit, Repeat, TrendingUp, Wallet } from 'lucide-react'
import ScenarioPlannerCard from '@/components/analysis/ScenarioPlannerCard'
import DocumentIntelligenceCard from '@/components/analysis/DocumentIntelligenceCard'
import LifeEventPlannerCard from '@/components/analysis/LifeEventPlannerCard'

interface BriefingPriority {
  title: string
  detail: string
  impact: 'critical' | 'high' | 'medium' | 'low'
  confidence: number
  metric: string
  direction: 'increase' | 'decrease'
}

interface ForecastPoint {
  month: string
  income: number
  expense: number
  projectedBalance: number
}

interface AnalysisResponse {
  summary: string
  priorities: BriefingPriority[]
  opportunities: { title: string; detail: string; estimatedMonthlyImpact: number }[]
  recurringSubscriptions: { category: string; description: string; amount: number; occurrences: number }[]
  forecast: {
    baseline: { monthlyIncome: number; monthlyExpense: number }
    forecast: ForecastPoint[]
  }
}

/** Legend entries for the forecast chart (colours match the series below). */
const FORECAST_LEGEND = [
  { label: 'Income', color: chartColors.positive },
  { label: 'Expense', color: chartColors.negative },
  { label: 'Projected balance', color: chartColors.brand },
]

export default function AnalysisPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchAnalysis()
    }
  }, [user])

  const fetchAnalysis = async () => {
    try {
      const response = await api.get('/analytics/financial-briefing')
      setAnalysisData(response.data)
    } catch (error) {
      console.error('Failed to fetch FinanceIQ briefing:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || !user || isLoading) {
    return (
      <DashboardLayout>
        <PageBackground variant="radial" />
        <div
          className="card relative z-10 flex min-h-[60vh] items-center justify-center p-8"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-5">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div aria-hidden="true" className="absolute inset-0 rounded-full bg-violet-500/20 blur-2xl" />
              <div aria-hidden="true" className="absolute inset-0 rounded-full border border-white/10" />
              <div
                aria-hidden="true"
                className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-cyan-400/70 border-t-primary-400"
              />
              <BrainCircuit className="h-6 w-6 text-violet-200" />
            </div>
            <p className="text-sm text-slate-400">Loading your financial analysis…</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const forecastData = analysisData?.forecast?.forecast || []
  const priorities = analysisData?.priorities || []
  const opportunities = analysisData?.opportunities || []
  const recurring = analysisData?.recurringSubscriptions || []

  return (
    <DashboardLayout>
      <PageBackground variant="radial" />
      <div className="relative z-10 space-y-6 lg:space-y-8">
        <PageHeader
          eyebrow="FinanceIQ Briefing"
          eyebrowIcon={BrainCircuit}
          eyebrowTone="ai"
          title={
            <>
              AI-style <span className="text-gradient">money intelligence</span>
            </>
          }
          description={analysisData?.summary}
        />

        <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
          <div className="card card-pad min-w-0 xl:col-span-2">
            <SectionHeader
              icon={TrendingUp}
              tone="brand"
              title="6-Month Cashflow Forecast"
              actions={
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-slate-300">
                  {FORECAST_LEGEND.map((entry) => (
                    <span key={entry.label} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }}
                      />
                      {entry.label}
                    </span>
                  ))}
                </div>
              }
            />
            <div className="mt-5 h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis {...axisProps} dataKey="month" />
                  <YAxis {...axisProps} width={64} />
                  <Tooltip cursor={tooltipCursor} />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke={chartColors.positive}
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: chartColors.positive, strokeWidth: 0 }}
                    activeDot={{ ...activeDot, fill: chartColors.positive }}
                    isAnimationActive={!reduceMotion}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke={chartColors.negative}
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: chartColors.negative, strokeWidth: 0 }}
                    activeDot={{ ...activeDot, fill: chartColors.negative }}
                    isAnimationActive={!reduceMotion}
                  />
                  <Line
                    type="monotone"
                    dataKey="projectedBalance"
                    stroke={chartColors.brand}
                    strokeWidth={3}
                    dot={{ r: 3, fill: chartColors.brand, strokeWidth: 0 }}
                    activeDot={activeDot}
                    isAnimationActive={!reduceMotion}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-5 grid gap-3 sm:gap-4 md:grid-cols-2">
              <div className="surface-inset p-4">
                <p className="eyebrow">Baseline income</p>
                <p className="kpi-value mt-2 text-2xl text-emerald-300">
                  {Math.round(analysisData?.forecast?.baseline?.monthlyIncome || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="surface-inset p-4">
                <p className="eyebrow">Baseline expense</p>
                <p className="kpi-value mt-2 text-2xl text-rose-300">
                  {Math.round(analysisData?.forecast?.baseline?.monthlyExpense || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          <div className="card card-pad min-w-0">
            <SectionHeader icon={AlertTriangle} tone="amber" title="Top Priorities" />
            <div className="mt-5 space-y-3">
              {priorities.length === 0 ? (
                <p className="surface-inset border-dashed p-4 text-sm text-slate-400">
                  Add more financial data to unlock personalized priorities.
                </p>
              ) : (
                priorities.map((priority) => (
                  <div key={`${priority.title}-${priority.metric}`} className="surface-inset surface-inset-hover p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 break-words text-sm font-semibold text-slate-100">{priority.title}</h3>
                      <span className="badge badge-ai shrink-0 uppercase tracking-wide">
                        {Math.round(priority.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{priority.detail}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <div className="card card-pad min-w-0">
            <SectionHeader icon={Wallet} tone="cyan" title="Opportunities" />
            <div className="mt-5 space-y-3">
              {opportunities.length === 0 ? (
                <p className="surface-inset border-dashed p-4 text-sm text-slate-400">
                  No clear opportunities yet. More budgeting and savings data will improve this section.
                </p>
              ) : (
                opportunities.map((item) => (
                  <div key={item.title} className="surface-inset surface-inset-hover p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 break-words text-sm font-semibold text-slate-100">{item.title}</h3>
                      <span className="num shrink-0 font-display text-sm font-semibold text-emerald-300">
                        {Math.round(item.estimatedMonthlyImpact).toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.detail}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card card-pad min-w-0">
            <SectionHeader icon={Repeat} tone="violet" title="Detected Recurring Expenses" />
            <div className="mt-5 space-y-3">
              {recurring.length === 0 ? (
                <p className="surface-inset border-dashed p-4 text-sm text-slate-400">
                  FinanceIQ has not detected enough recurring expense patterns yet.
                </p>
              ) : (
                recurring.map((item) => (
                  <div key={`${item.description}-${item.amount}`} className="surface-inset surface-inset-hover p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 break-words text-sm font-semibold text-slate-100">{item.description}</h3>
                      <span className="num shrink-0 font-display text-sm font-semibold text-slate-200">
                        {Math.round(item.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {item.category} | {item.occurrences} occurrences detected
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <ScenarioPlannerCard />
        <LifeEventPlannerCard />
        <DocumentIntelligenceCard />
      </div>
    </DashboardLayout>
  )
}
