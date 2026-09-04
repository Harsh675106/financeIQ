'use client'

import { useEffect, useState, useRef } from 'react'
import { api } from '@/lib/api'
import { useCountUp } from '@/hooks/useCountUp'
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
  accentGlow = 'rgba(16, 185, 129, 0.15)',
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
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} icon-morph-container shadow-sm`}
        >
          <Icon className={`h-5 w-5 ${iconColor} transition-all duration-300 group-hover:scale-110`} />
        </div>
      </div>

      <div className="flex items-baseline space-x-1.5">
        <span className="text-3xl font-extrabold tracking-tight text-slate-50 counter-pulse">
          {prefix}
          {animatedValue.toLocaleString('en-IN')}
          {suffix}
        </span>
      </div>

      {trendLabel && (
        <div className="mt-3 flex items-center gap-1.5">
          {trendType === 'positive' && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
              <ArrowUpRight className="h-3 w-3" />
              {trendLabel}
            </span>
          )}
          {trendType === 'negative' && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-rose-400 ring-1 ring-rose-500/20">
              <ArrowDownRight className="h-3 w-3" />
              {trendLabel}
            </span>
          )}
          {trendType === 'neutral' && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-800/80 px-1.5 py-0.5 text-[11px] font-semibold text-slate-400">
              {trendLabel}
            </span>
          )}
          <span className="text-[11px] text-slate-500">vs target</span>
        </div>
      )}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card card-pad animate-pulse">
            <div className="h-4 bg-slate-800 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-slate-800 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!data?.hasData) {
    return (
      <div className="card card-pad text-center py-12 card-spotlight">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-400 mb-4 animate-bounce-subtle">
          <TrendingUp className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-50 mb-2">No Financial Records Yet</h3>
        <p className="text-slate-400 max-w-md mx-auto mb-6 text-sm">
          Add your first transaction, wealth asset, or income stream to power real-time AI analytics.
        </p>
        <button
          onClick={() => (window.location.href = '/dashboard/transactions')}
          className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-primary-500/20 hover:scale-105 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          Add First Transaction
        </button>
      </div>
    )
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-primary-300'
    if (score >= 40) return 'text-amber-400'
    return 'text-rose-400'
  }

  const getHealthScoreBg = (score: number) => {
    if (score >= 80) return 'stroke-emerald-400'
    if (score >= 60) return 'stroke-emerald-500'
    if (score >= 40) return 'stroke-amber-400'
    return 'stroke-rose-400'
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
    <div className="space-y-6">
      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Interactive Health Score with SVG Circular Gauge */}
        <div className="card card-pad card-spotlight group cursor-pointer animate-fade-up stagger-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Health Score
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className={`text-4xl font-extrabold tracking-tight ${getHealthScoreColor(data.healthScore)}`}>
                  {animatedHealthScore}
                </span>
                <span className="text-xs font-semibold text-slate-500">/100</span>
              </div>
              <p className={`text-xs font-medium mt-1 ${getHealthScoreColor(data.healthScore)}`}>
                {getHealthScoreLabel(data.healthScore)}
              </p>
            </div>

            {/* Circular Mini Gauge */}
            <div className="relative flex items-center justify-center">
              <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 70 70">
                <circle
                  cx="35"
                  cy="35"
                  r={radius}
                  className="stroke-slate-800"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="35"
                  cy="35"
                  r={radius}
                  className={`gauge-progress-circle ${getHealthScoreBg(data.healthScore)}`}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <ShieldCheck
                className={`absolute h-6 w-6 ${getHealthScoreColor(data.healthScore)} transition-transform group-hover:scale-125 duration-300`}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Income */}
        <MetricCard
          title="Monthly Income"
          value={data.totalIncome}
          prefix="₹"
          icon={TrendingUp}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10 border border-emerald-500/20"
          trendLabel="+8.2%"
          trendType="positive"
          delay={50}
        />

        {/* Card 3: Expenses */}
        <MetricCard
          title="Monthly Expenses"
          value={data.totalExpenses}
          prefix="₹"
          icon={TrendingDown}
          iconColor="text-rose-400"
          iconBg="bg-rose-500/10 border border-rose-500/20"
          trendLabel="-3.5%"
          trendType="positive"
          delay={100}
        />

        {/* Card 4: Net Savings */}
        <MetricCard
          title="Net Savings"
          value={data.savings}
          prefix="₹"
          icon={Percent}
          iconColor="text-primary-300"
          iconBg="bg-primary-500/10 border border-primary-500/20"
          trendLabel={`${savingsRate}% Rate`}
          trendType="positive"
          delay={150}
        />
      </div>

      {/* Diagnostics & Sub-Scores Breakdown Accordion */}
      {data?.healthBreakdown && (
        <div className="card border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl overflow-hidden animate-fade-up">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="w-full flex items-center justify-between p-4 px-6 hover:bg-slate-800/40 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-500/10 text-primary-400">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold text-slate-200">
                Financial Health Diagnostics Breakdown
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                (5 Core Analytical Pillars)
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-xs font-medium">{showDiagnostics ? 'Collapse' : 'Expand'}</span>
              {showDiagnostics ? (
                <ChevronUp className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              )}
            </div>
          </button>

          {showDiagnostics && (
            <div className="p-6 pt-2 border-t border-slate-800/60 animate-fade-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  {
                    label: 'Savings Rate',
                    value: data.healthBreakdown.savingsScore,
                    unit: '%',
                    help: 'Target: >20% income saved',
                    color: 'from-primary-500 to-emerald-400',
                  },
                  {
                    label: 'Emergency Fund',
                    value: data.healthBreakdown.emergencyScore,
                    unit: '%',
                    help: 'Target: 6 months reserve',
                    color: 'from-primary-500 to-emerald-400',
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
                        ? 'from-rose-500 to-red-500'
                        : 'from-emerald-500 to-teal-400',
                    isDebt: true,
                  },
                  {
                    label: 'Goal Velocity',
                    value: data.healthBreakdown.goalScore,
                    unit: '%',
                    help: 'Timeline progress score',
                    color: 'from-primary-500 to-emerald-400',
                  },
                  {
                    label: 'Asset Diversification',
                    value: data.healthBreakdown.diversificationScore,
                    unit: '%',
                    help: 'Cross-asset distribution',
                    color: 'from-primary-500 to-emerald-400',
                  },
                ].map((item, idx) => {
                  const hasValue = item.value !== null && item.value !== undefined
                  const scoreVal = hasValue ? Math.round(item.value as number) : null

                  return (
                    <div
                      key={idx}
                      className="group rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 transition-all duration-300 hover:border-primary-500/40 hover:bg-slate-900/80 hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                          {item.label}
                        </span>
                        <span
                          className={`text-xs font-bold ${
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
                      <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`bg-gradient-to-r ${item.color} h-1.5 rounded-full transition-all duration-700 ease-out`}
                          style={{
                            width: `${
                              scoreVal === null ? 0 : Math.min(100, Math.max(0, scoreVal))
                            }%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-[10px] text-slate-500 leading-tight">
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
