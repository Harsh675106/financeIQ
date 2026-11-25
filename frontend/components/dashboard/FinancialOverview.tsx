'use client'

import { useEffect, useState, useRef } from 'react'
import { api } from '@/lib/api'
import { useCountUp } from '@/hooks/useCountUp'
import EmptyState from '@/components/ui/EmptyState'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from 'lucide-react'

interface FinancialData {
  hasData: boolean
  healthScore: number
  totalIncome: number
  totalExpenses: number
  savings: number
  debtRatio: number | null
  debt: {
    total: number
    recordCount: number
    dataStatus: 'available' | 'zero' | 'unavailable'
  }
  healthBreakdown?: {
    savingsScore: number
    emergencyScore: number
    debtImpact: number | null
    goalScore: number
    diversificationScore: number
  }
}

// Sub-component for individual animated KPI metric card with spotlight tracking
function MetricCard({
  title,
  value,
  prefix = '',
  suffix = '',
  icon: Icon,
  iconColor,
  iconBg,
  trendLabel,
  trendType = 'positive',
  delay = 0,
  accentGlow = 'rgba(112, 104, 244, 0.18)',
}: {
  title: string
  value: number
  prefix?: string
  suffix?: string
  icon: any
  iconColor: string
  iconBg: string
  trendLabel?: string
  trendType?: 'positive' | 'negative' | 'neutral'
  delay?: number
  accentGlow?: string
}) {
  const animatedValue = useCountUp(value, { duration: 1000 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cardRef.current.style.setProperty('--mouse-x', `${x}px`)
    cardRef.current.style.setProperty('--mouse-y', `${y}px`)
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="card card-pad card-spotlight group cursor-pointer animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Ambient accent glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-70 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: accentGlow }}
      />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="eyebrow pt-1">{title}</span>
          <span className={`icon-tile ${iconBg} icon-morph-container`}>
            <Icon className={`h-[18px] w-[18px] ${iconColor}`} />
          </span>
        </div>

        <p className="kpi-value counter-pulse text-2xl [overflow-wrap:anywhere] sm:text-3xl xl:text-2xl 2xl:text-3xl">
          {prefix}
          {animatedValue.toLocaleString('en-IN')}
          {suffix}
        </p>

        {trendLabel && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {trendType === 'positive' && (
              <span className="badge badge-success">
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                {trendLabel}
              </span>
            )}
            {trendType === 'negative' && (
              <span className="badge badge-danger">
                <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
                {trendLabel}
              </span>
            )}
            {trendType === 'neutral' && <span className="badge badge-neutral">{trendLabel}</span>}
            <span className="text-[11px] text-slate-500">vs target</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FinancialOverview() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDiagnostics, setShowDiagnostics] = useState(true)

  const fetchFinancialData = async () => {
    try {
      const response = await api.get('/analytics/dashboard')
      setData({
        hasData: response.data.hasData,
        healthScore: response.data.healthScore,
        totalIncome: response.data.totals.income,
        totalExpenses: response.data.totals.expenses,
        savings: response.data.totals.savings,
        debtRatio: response.data.metrics.debtRatio,
        debt: response.data.debt,
        healthBreakdown: response.data.healthBreakdown,
      })
    } catch (error: any) {
      console.error('Failed to fetch financial data:', error)
      setData({
        hasData: false,
        healthScore: 0,
        totalIncome: 0,
        totalExpenses: 0,
        savings: 0,
        debtRatio: null,
        debt: { total: 0, recordCount: 0, dataStatus: 'unavailable' },
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinancialData()
    const interval = setInterval(fetchFinancialData, 30000)
    return () => clearInterval(interval)
  }, [])

  const animatedHealthScore = useCountUp(data?.healthScore || 0, { duration: 1100 })

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4" aria-busy="true">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card card-pad">
            <div className="mb-5 flex items-center justify-between">
              <div className="skeleton h-3 w-1/2" />
              <div className="skeleton h-10 w-10 rounded-xl" />
            </div>
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton mt-4 h-5 w-1/3 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!data?.hasData) {
    return (
      <div className="card card-pad card-spotlight">
        <EmptyState
          icon={TrendingUp}
          tone="brand"
          title="No Financial Records Yet"
          description="Add your first transaction, wealth asset, or income stream to power real-time AI analytics."
          action={
            <button
              onClick={() => (window.location.href = '/dashboard/transactions')}
              className="btn-primary btn-lg"
            >
              <Sparkles className="h-4 w-4" />
              Add First Transaction
            </button>
          }
        />
      </div>
    )
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-primary-300'
    if (score >= 40) return 'text-amber-400'
    return 'text-rose-400'
  }

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Optimal Health'
    if (score >= 60) return 'Good Standing'
    if (score >= 40) return 'Moderate Action'
    return 'Critical Attention'
  }

  const savingsRate =
    data.totalIncome > 0
      ? Math.round(((data.totalIncome - data.totalExpenses) / data.totalIncome) * 100)
      : 0

  const radius = 28
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (animatedHealthScore / 100) * circumference

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
        {/* Card 1: Interactive Health Score with SVG Circular Gauge */}
        <div className="card card-pad card-spotlight group cursor-pointer animate-fade-up stagger-1">
          {/* Aurora ambient glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-primary-500/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -right-10 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl"
          />

          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow">Health Score</span>
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`kpi-value text-4xl sm:text-[2.75rem] xl:text-4xl 2xl:text-[2.75rem] ${getHealthScoreColor(
                      data.healthScore
                    )}`}
                  >
                    {animatedHealthScore}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">/100</span>
                </div>
                <p className={`mt-1.5 text-xs font-medium ${getHealthScoreColor(data.healthScore)}`}>
                  {getHealthScoreLabel(data.healthScore)}
                </p>
              </div>

              {/* Circular Mini Gauge — brand aurora gradient */}
              <div className="relative flex shrink-0 items-center justify-center">
                <div aria-hidden="true" className="absolute inset-2 rounded-full bg-primary-500/20 blur-xl" />
                <svg
                  className="relative h-20 w-20 -rotate-90 transform drop-shadow-[0_0_10px_rgba(138,136,251,0.45)]"
                  viewBox="0 0 70 70"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="fi-health-gauge-aurora" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8a88fb" />
                      <stop offset="45%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="35"
                    cy="35"
                    r={radius}
                    className="stroke-white/[0.07]"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="35"
                    cy="35"
                    r={radius}
                    className="gauge-progress-circle"
                    stroke="url(#fi-health-gauge-aurora)"
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <ShieldCheck
                  className={`absolute h-6 w-6 ${getHealthScoreColor(
                    data.healthScore
                  )} transition-transform duration-300 motion-safe:group-hover:scale-110`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Income */}
        <MetricCard
          title="Monthly Income"
          value={data.totalIncome}
          prefix="₹"
          icon={TrendingUp}
          iconColor="text-emerald-300"
          iconBg="icon-tile-emerald"
          trendLabel="+8.2%"
          trendType="positive"
          delay={50}
          accentGlow="rgba(16, 185, 129, 0.16)"
        />

        {/* Card 3: Expenses */}
        <MetricCard
          title="Monthly Expenses"
          value={data.totalExpenses}
          prefix="₹"
          icon={TrendingDown}
          iconColor="text-rose-300"
          iconBg="icon-tile-rose"
          trendLabel="-3.5%"
          trendType="positive"
          delay={100}
          accentGlow="rgba(244, 63, 94, 0.14)"
        />

        {/* Card 4: Net Savings */}
        <MetricCard
          title="Net Savings"
          value={data.savings}
          prefix="₹"
          icon={Percent}
          iconColor="text-primary-200"
          iconBg="icon-tile-brand"
          trendLabel={`${savingsRate}% Rate`}
          trendType="positive"
          delay={150}
          accentGlow="rgba(112, 104, 244, 0.2)"
        />
      </div>

      {/* Diagnostics & Sub-Scores Breakdown Accordion */}
      {data?.healthBreakdown && (
        <div className="card overflow-hidden animate-fade-up">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            aria-expanded={showDiagnostics}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.03] sm:px-6"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="icon-tile icon-tile-sm icon-tile-brand">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0 sm:flex sm:items-baseline sm:gap-2">
                <span className="block font-display text-sm font-semibold tracking-tight text-slate-100 sm:inline">
                  Financial Health Diagnostics Breakdown
                </span>
                <span className="hidden text-xs text-slate-500 sm:inline">(5 Core Analytical Pillars)</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-slate-400">
              <span className="hidden text-xs font-medium sm:inline">{showDiagnostics ? 'Collapse' : 'Expand'}</span>
              <span className="btn-icon h-8 w-8">
                {showDiagnostics ? (
                  <ChevronUp className="h-4 w-4 transition-transform duration-200" />
                ) : (
                  <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                )}
              </span>
            </div>
          </button>

          {showDiagnostics && (
            <div className="border-t border-white/[0.06] p-5 animate-fade-up sm:p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
                {[
                  {
                    label: 'Savings Rate',
                    value: data.healthBreakdown.savingsScore,
                    unit: '%',
                    help: 'Target: >20% income saved',
                    color: 'bg-gradient-to-r from-primary-400 via-violet-400 to-cyan-400',
                  },
                  {
                    label: 'Emergency Fund',
                    value: data.healthBreakdown.emergencyScore,
                    unit: '%',
                    help: 'Target: 6 months reserve',
                    color: 'bg-gradient-to-r from-primary-400 via-violet-400 to-cyan-400',
                  },
                  {
                    label: 'Debt Burden',
                    value: data.healthBreakdown.debtImpact,
                    unit: '%',
                    help:
                      data.debt.dataStatus === 'unavailable'
                        ? 'No debt records added'
                        : data.debt.total === 0 || data.healthBreakdown.debtImpact === 0
                        ? 'Healthy — 0% debt burden'
                        : data.debtRatio !== null
                        ? `${data.debtRatio}% DTI ratio`
                        : `₹${data.debt.total.toLocaleString('en-IN')} total debt`,
                    color:
                      (data.healthBreakdown.debtImpact || 0) > 40
                        ? 'bg-gradient-to-r from-rose-500 to-pink-400'
                        : 'bg-gradient-to-r from-emerald-400 to-teal-300',
                    isDebt: true,
                  },
                  {
                    label: 'Goal Velocity',
                    value: data.healthBreakdown.goalScore,
                    unit: '%',
                    help: 'Timeline progress score',
                    color: 'bg-gradient-to-r from-primary-400 via-violet-400 to-cyan-400',
                  },
                  {
                    label: 'Asset Diversification',
                    value: data.healthBreakdown.diversificationScore,
                    unit: '%',
                    help: 'Cross-asset distribution',
                    color: 'bg-gradient-to-r from-primary-400 via-violet-400 to-cyan-400',
                  },
                ].map((item, idx) => {
                  const hasValue = item.value !== null && item.value !== undefined
                  const scoreVal = hasValue ? Math.round(item.value as number) : null

                  return (
                    <div
                      key={idx}
                      className="group surface-inset surface-inset-hover p-3.5 transition-transform duration-300 motion-safe:hover:-translate-y-0.5"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-xs font-medium text-slate-400 transition-colors group-hover:text-slate-200">
                          {item.label}
                        </span>
                        <span
                          className={`num text-xs font-bold ${
                            scoreVal === null
                              ? 'text-slate-500'
                              : item.isDebt && scoreVal === 0
                              ? 'text-emerald-400'
                              : 'text-primary-300'
                          }`}
                        >
                          {scoreVal === null ? '—' : `${scoreVal}%`}
                        </span>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="progress-track h-1.5">
                        <div
                          className={`${item.color} h-full rounded-full transition-[width] duration-700 ease-out`}
                          style={{
                            width: `${
                              scoreVal === null ? 0 : Math.min(100, Math.max(0, scoreVal))
                            }%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-[11px] leading-tight text-slate-500">
                        {item.help}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

