'use client'

import { useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/api'
import {
  BrainCircuit,
  TrendingDown,
  Sparkles,
  Zap,
  Flame,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  Coins
} from 'lucide-react'
import { safeNumber, formatINR } from '@/lib/formatters'
import SectionHeader from '@/components/ui/SectionHeader'

interface Strategy {
  strategy: 'avalanche' | 'snowball'
  monthsToDebtFree: number | null
  totalInterest: number
  payoffOrder: { id: number; debtType: string; description: string; month: number }[]
}

interface DebtPlan {
  hasDebts: boolean
  monthlyPaymentBudget: number
  summary: string
  strategies: Strategy[]
  recommendedStrategy: (Strategy & { label: string }) | null
}

interface DebtOptimizerCardProps {
  refreshKey?: number
}

export default function DebtOptimizerCard({ refreshKey = 0 }: DebtOptimizerCardProps) {
  const [data, setData] = useState<DebtPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStrategy, setSelectedStrategy] = useState<'avalanche' | 'snowball'>('avalanche')
  const [extraPayment, setExtraPayment] = useState(2500) // extra payment accelerator slider

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/debts/optimizer/plan')
        setData(res.data)
        if (res.data?.recommendedStrategy?.strategy) {
          setSelectedStrategy(res.data.recommendedStrategy.strategy)
        }
      } catch (error) {
        console.error('Failed to load debt optimizer', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [refreshKey])

  // Active strategy object
  const activeStrat = useMemo(() => {
    if (!data?.strategies) return null
    return data.strategies.find((s) => s.strategy === selectedStrategy) || data.strategies[0]
  }, [data, selectedStrategy])

  // Dynamic extra payment calculation impact
  const acceleratedMetrics = useMemo(() => {
    if (!activeStrat || !activeStrat.monthsToDebtFree) return null

    const baseMonths = safeNumber(activeStrat.monthsToDebtFree, 12)
    const baseInterest = safeNumber(activeStrat.totalInterest, 0)
    const baseBudget = safeNumber(data?.monthlyPaymentBudget, 10000)
    const safeExtra = safeNumber(extraPayment, 0)

    // Acceleration factor
    const speedRatio = (baseBudget + safeExtra) / (baseBudget || 1)
    const newMonths = Math.max(1, Math.round(baseMonths / Math.pow(speedRatio, 0.75)))
    const monthsSaved = Math.max(0, baseMonths - newMonths)
    const interestSaved = Math.max(0, Math.round(baseInterest * (1 - newMonths / baseMonths) * 0.85))

    return {
      newMonths,
      monthsSaved,
      interestSaved,
    }
  }, [activeStrat, extraPayment, data?.monthlyPaymentBudget])

  return (
    <div className="card card-pad stage-card-lift relative overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-50 blur-3xl"
      />

      {/* Header */}
      <SectionHeader
        as="h3"
        icon={BrainCircuit}
        tone="violet"
        className="relative mb-6 border-b border-line pb-5"
        title={
          <span className="flex flex-wrap items-center gap-2 whitespace-normal">
            AI Debt Payoff Engine & Accelerator
            <span className="badge badge-ai">
              <Sparkles className="h-3.5 w-3.5" />
              Optimized Matrix
            </span>
          </span>
        }
        subtitle="Mathematical avalanche & psychological snowball simulations"
        actions={
          /* Strategy switcher buttons */
          data?.hasDebts && (
            <div className="scroll-thin max-w-full overflow-x-auto">
              <div className="segmented">
                <button
                  onClick={() => setSelectedStrategy('avalanche')}
                  aria-pressed={selectedStrategy === 'avalanche'}
                  className={`segmented-item ${selectedStrategy === 'avalanche' ? 'segmented-item-active' : ''}`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Avalanche (Max Savings)
                </button>
                <button
                  onClick={() => setSelectedStrategy('snowball')}
                  aria-pressed={selectedStrategy === 'snowball'}
                  className={`segmented-item ${selectedStrategy === 'snowball' ? 'segmented-item-active' : ''}`}
                >
                  <Flame className="h-3.5 w-3.5" />
                  Snowball (Quick Wins)
                </button>
              </div>
            </div>
          )
        }
      />

      {loading ? (
        <div className="relative space-y-3" role="status" aria-live="polite">
          <div className="skeleton h-20" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
          </div>
          <span className="sr-only">Loading debt optimizer</span>
        </div>
      ) : !data?.hasDebts ? (
        <div className="relative flex items-center gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-emerald-50/40 to-transparent p-4 sm:p-5">
          <span className="icon-tile icon-tile-lg icon-tile-emerald">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-ink-900">Zero Debt Burden Detected 🎉</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              You are currently debt-free! 100% of your surplus cash flow is available to accelerate savings and investments.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative space-y-5">
          {/* Strategy Summary Banner */}
          <div className="surface-highlight p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-60 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary-500" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700">
                  {selectedStrategy === 'avalanche' ? 'Avalanche Strategy (Highest APR first)' : 'Snowball Strategy (Smallest balance first)'}
                </span>
                {data.recommendedStrategy?.strategy === selectedStrategy && (
                  <span className="badge badge-ai uppercase">
                    AI Recommended
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500">
                Monthly Budget: <strong className="num font-semibold text-primary-700">₹{formatINR(data.monthlyPaymentBudget)}</strong>
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">{data.summary}</p>
          </div>

          {/* Strategy Compare Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.strategies.map((strategy) => {
              const isSelected = selectedStrategy === strategy.strategy
              return (
                <div
                  key={strategy.strategy}
                  onClick={() => setSelectedStrategy(strategy.strategy)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-[border-color,background-color,box-shadow] duration-300 ${
                    isSelected
                      ? 'border-primary-300 bg-primary-50/60 shadow-card ring-1 ring-primary-200'
                      : 'border-line bg-white hover:border-line-strong hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`icon-tile icon-tile-sm ${isSelected ? 'icon-tile-brand' : 'icon-tile-slate'}`}>
                        {strategy.strategy === 'avalanche' ? (
                          <Zap className="h-4 w-4" />
                        ) : (
                          <Flame className="h-4 w-4" />
                        )}
                      </span>
                      <h4 className="truncate font-display text-sm font-semibold capitalize text-ink-900">
                        {strategy.strategy} Method
                      </h4>
                    </div>
                    {isSelected && (
                      <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-primary-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Selected
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-line bg-white p-2.5">
                      <span className="text-slate-500">Debt-Free Horizon</span>
                      <p className="num mt-0.5 text-sm font-semibold text-ink-900">
                        {strategy.monthsToDebtFree === null ? 'Long horizon' : `${strategy.monthsToDebtFree} Months`}
                      </p>
                    </div>
                    <div className="rounded-xl border border-line bg-white p-2.5">
                      <span className="text-slate-500">Total Interest</span>
                      <p className="num mt-0.5 break-words text-sm font-semibold text-amber-700">
                        ₹{formatINR(strategy.totalInterest)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Interactive Extra Payment Accelerator Slider */}
          <div className="surface-inset space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="icon-tile icon-tile-sm icon-tile-brand">
                  <Coins className="h-4 w-4" />
                </span>
                <span className="text-xs font-semibold text-ink-800">
                  Boost Extra Monthly Paydown:
                </span>
              </div>
              <span className="num font-display text-sm font-semibold text-primary-700">
                +₹{formatINR(extraPayment)}/mo
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="25000"
              step="500"
              value={extraPayment}
              onChange={(e) => setExtraPayment(Number(e.target.value))}
              aria-label="Boost extra monthly paydown"
              className="pf-range cursor-pointer"
            />

            {acceleratedMetrics && (
              <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-3">
                <div className="rounded-xl border border-line bg-white p-3">
                  <span className="text-[11px] text-slate-500">Accelerated Timeline</span>
                  <p className="num mt-0.5 text-sm font-semibold text-emerald-700">
                    {acceleratedMetrics.newMonths} Months
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-white p-3">
                  <span className="text-[11px] text-slate-500">Time Saved</span>
                  <p className="num mt-0.5 text-sm font-semibold text-sky-700">
                    -{acceleratedMetrics.monthsSaved} Months Faster
                  </p>
                </div>

                <div className="col-span-2 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-ice-50 p-3 sm:col-span-1">
                  <span className="text-[11px] font-medium text-emerald-700">Interest Saved</span>
                  <p className="num mt-0.5 break-words font-display text-sm font-semibold text-emerald-700">
                    ₹{formatINR(acceleratedMetrics.interestSaved)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Payoff Order Timeline */}
          {activeStrat?.payoffOrder?.length ? (
            <div className="surface-inset space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-primary-600" />
                  <p className="text-xs font-semibold text-ink-800">Recommended Payoff Sequence</p>
                </div>
                <span className="eyebrow text-[10px]">Priority order</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {activeStrat.payoffOrder.slice(0, 4).map((item, idx) => (
                  <div
                    key={`${item.id}-${item.month}`}
                    className="flex min-w-0 flex-col justify-between gap-2 rounded-xl border border-line bg-white p-3 transition-colors hover:border-primary-200"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="num flex h-6 w-6 items-center justify-center rounded-full bg-primary-50 text-[10px] font-semibold text-primary-700 ring-1 ring-primary-200">
                        #{idx + 1}
                      </span>
                      <span className="num flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="h-3 w-3 text-slate-400" />
                        Month {item.month}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink-900">{item.debtType}</p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {item.description || 'Target Payoff'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
