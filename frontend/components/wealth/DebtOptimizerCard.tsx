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

    const baseMonths = activeStrat.monthsToDebtFree
    const baseInterest = activeStrat.totalInterest
    const baseBudget = data?.monthlyPaymentBudget || 10000

    // Acceleration factor
    const speedRatio = (baseBudget + extraPayment) / (baseBudget || 1)
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
    <div className="relative overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950/95 p-6 md:p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 stage-card-lift">
      {/* Background glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-primary-500/15 blur-3xl" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/25 to-teal-500/15 border border-primary-500/40 shadow-lg">
            <BrainCircuit className="h-6 w-6 text-primary-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              AI Debt Payoff Engine & Accelerator
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/15 px-2.5 py-0.5 text-xs font-semibold text-primary-300 border border-primary-500/30">
                <Sparkles className="h-3.5 w-3.5" />
                Optimized Matrix
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Mathematical avalanche & psychological snowball simulations</p>
          </div>
        </div>

        {/* Strategy switcher buttons */}
        {data?.hasDebts && (
          <div className="flex items-center gap-1 rounded-xl bg-slate-800/70 p-1 border border-slate-700/50">
            <button
              onClick={() => setSelectedStrategy('avalanche')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all duration-200 ${
                selectedStrategy === 'avalanche'
                  ? 'bg-primary-500 text-slate-950 shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Avalanche (Max Savings)
            </button>
            <button
              onClick={() => setSelectedStrategy('snowball')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all duration-200 ${
                selectedStrategy === 'snowball'
                  ? 'bg-primary-500 text-slate-950 shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              Snowball (Quick Wins)
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-36 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
      ) : !data?.hasDebts ? (
        <div className="flex items-center gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <ShieldCheck className="h-8 w-8 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-100">Zero Debt Burden Detected 🎉</p>
            <p className="text-xs text-slate-400 mt-0.5">
              You are currently debt-free! 100% of your surplus cash flow is available to accelerate savings and investments.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Strategy Summary Banner */}
          <div className="rounded-2xl border border-primary-500/20 bg-gradient-to-r from-primary-500/10 via-teal-500/5 to-slate-900/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-primary-400 animate-ping" />
                <span className="text-xs font-bold text-primary-300 uppercase tracking-wider">
                  {selectedStrategy === 'avalanche' ? 'Avalanche Strategy (Highest APR first)' : 'Snowball Strategy (Smallest balance first)'}
                </span>
                {data.recommendedStrategy?.strategy === selectedStrategy && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300 border border-emerald-500/30">
                    AI Recommended
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-300">
                Monthly Budget: <strong className="text-primary-300 font-mono">₹{Math.round(data.monthlyPaymentBudget).toLocaleString('en-IN')}</strong>
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">{data.summary}</p>
          </div>

          {/* Strategy Compare Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.strategies.map((strategy) => {
              const isSelected = selectedStrategy === strategy.strategy
              return (
                <div
                  key={strategy.strategy}
                  onClick={() => setSelectedStrategy(strategy.strategy)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all duration-300 ${
                    isSelected
                      ? 'border-primary-500/50 bg-slate-900/90 shadow-lg shadow-primary-500/5 ring-1 ring-primary-500/30'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {strategy.strategy === 'avalanche' ? (
                        <Zap className={`h-4 w-4 ${isSelected ? 'text-primary-400' : 'text-slate-400'}`} />
                      ) : (
                        <Flame className={`h-4 w-4 ${isSelected ? 'text-primary-400' : 'text-slate-400'}`} />
                      )}
                      <h4 className="font-semibold text-slate-100 capitalize text-sm">
                        {strategy.strategy} Method
                      </h4>
                    </div>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-primary-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Selected
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-800/50 p-2 border border-slate-800">
                      <span className="text-slate-400">Debt-Free Horizon</span>
                      <p className="font-bold text-slate-100 text-sm mt-0.5">
                        {strategy.monthsToDebtFree === null ? 'Long horizon' : `${strategy.monthsToDebtFree} Months`}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-2 border border-slate-800">
                      <span className="text-slate-400">Total Interest</span>
                      <p className="font-bold text-amber-300 text-sm mt-0.5">
                        ₹{Math.round(strategy.totalInterest).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Interactive Extra Payment Accelerator Slider */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Boost Extra Monthly Paydown:
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-emerald-400">
                +₹{extraPayment.toLocaleString('en-IN')}/mo
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="25000"
              step="500"
              value={extraPayment}
              onChange={(e) => setExtraPayment(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-emerald-400 transition"
            />

            {acceleratedMetrics && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div className="rounded-xl bg-slate-800/50 p-2.5 border border-slate-700/50">
                  <span className="text-[11px] text-slate-400">Accelerated Timeline</span>
                  <p className="text-sm font-bold text-emerald-300 mt-0.5">
                    {acceleratedMetrics.newMonths} Months
                  </p>
                </div>

                <div className="rounded-xl bg-slate-800/50 p-2.5 border border-slate-700/50">
                  <span className="text-[11px] text-slate-400">Time Saved</span>
                  <p className="text-sm font-bold text-cyan-300 mt-0.5">
                    -{acceleratedMetrics.monthsSaved} Months Faster
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1 rounded-xl bg-emerald-500/10 p-2.5 border border-emerald-500/20">
                  <span className="text-[11px] text-emerald-300">Interest Saved</span>
                  <p className="text-sm font-bold text-emerald-300 mt-0.5">
                    ₹{acceleratedMetrics.interestSaved.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Payoff Order Timeline */}
          {activeStrat?.payoffOrder?.length ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-primary-400" />
                  <p className="text-xs font-semibold text-slate-200">Recommended Payoff Sequence</p>
                </div>
                <span className="text-[11px] text-slate-400">Priority order</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {activeStrat.payoffOrder.slice(0, 4).map((item, idx) => (
                  <div
                    key={`${item.id}-${item.month}`}
                    className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-3 transition hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500/20 text-[10px] font-bold text-primary-300 border border-primary-500/30">
                        #{idx + 1}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3 text-slate-500" />
                        Month {item.month}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-100 truncate">{item.debtType}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
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
