'use client'

import { useState, useMemo } from 'react'
import {
  TrendingUp,
  Sparkles,
  Coins,
  Calendar,
  Shield,
  Zap,
  CheckCircle2,
  HelpCircle,
  PiggyBank,
  ArrowRight
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'
import { safeNumber, formatINR } from '@/lib/formatters'
import SectionHeader from '@/components/ui/SectionHeader'
import { ChartTooltipCard } from '@/components/ui/ChartTooltip'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  chartColors,
  axisProps,
  axisTick,
  gridProps,
  tooltipCursor,
  activeDot,
} from '@/lib/chartTheme'

interface SavingsGrowthSimulatorProps {
  currentSavings: number
}

export default function SavingsGrowthSimulator({ currentSavings }: SavingsGrowthSimulatorProps) {
  const safeCurrentSavings = Math.max(0, safeNumber(currentSavings, 0))
  const [monthlyContribution, setMonthlyContribution] = useState(15000)
  const [expectedReturn, setExpectedReturn] = useState(12) // 12% CAGR
  const [years, setYears] = useState(10)
  const [initialAmount, setInitialAmount] = useState(safeCurrentSavings > 0 ? Math.round(safeCurrentSavings) : 50000)
  const reduceMotion = useReducedMotion()

  // Calculate year-by-year compounding projection
  const projectionData = useMemo(() => {
    const data = []
    const safeInit = Math.max(0, safeNumber(initialAmount, 0))
    const safeMonthly = Math.max(0, safeNumber(monthlyContribution, 0))
    const safeReturn = Math.max(0, safeNumber(expectedReturn, 12))
    const safeYears = Math.max(1, Math.min(50, Math.round(safeNumber(years, 10))))

    const monthlyRate = safeReturn / 100 / 12
    let currentBalance = safeInit
    let totalInvested = safeInit

    data.push({
      year: 'Year 0',
      invested: Math.round(totalInvested),
      wealth: Math.round(currentBalance),
      interest: 0,
    })

    for (let yr = 1; yr <= safeYears; yr++) {
      for (let m = 0; m < 12; m++) {
        currentBalance = (currentBalance + safeMonthly) * (1 + monthlyRate)
        totalInvested += safeMonthly
      }
      const gains = Math.max(0, currentBalance - totalInvested)
      data.push({
        year: `Y${yr}`,
        invested: Math.round(safeNumber(totalInvested, 0)),
        wealth: Math.round(safeNumber(currentBalance, 0)),
        interest: Math.round(safeNumber(gains, 0)),
      })
    }

    return data
  }, [initialAmount, monthlyContribution, expectedReturn, years])

  const finalState = projectionData[projectionData.length - 1]
  const finalWealth = safeNumber(finalState?.wealth, 0)
  const finalInvested = safeNumber(finalState?.invested, 0)
  const finalInterestGained = safeNumber(finalState?.interest, 0)

  // Emergency Fund milestones (assuming ~₹40k monthly living expense)
  const monthlyExpenseEstimate = 35000
  const runwayMonths = Math.floor(safeCurrentSavings / (monthlyExpenseEstimate || 1))

  return (
    <div className="card card-pad stage-card-lift relative overflow-hidden">
      {/* Background radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl"
      />

      {/* Header */}
      <SectionHeader
        as="h3"
        icon={TrendingUp}
        tone="cyan"
        className="relative mb-6 border-b border-white/[0.06] pb-5"
        title={
          <span className="flex flex-wrap items-center gap-2 whitespace-normal">
            Compound Growth & Wealth Engine
            <span className="badge badge-brand">
              <Sparkles className="h-3.5 w-3.5" />
              Live Simulator
            </span>
          </span>
        }
        subtitle="Forecast the exponential power of compounding interest"
        actions={
          /* Milestone Indicator */
          <div className="surface-inset flex items-center gap-2 px-3 py-2">
            <PiggyBank className="h-4 w-4 shrink-0 text-cyan-300" />
            <span className="text-xs text-slate-400">
              Current Reserve: <strong className="num font-semibold text-cyan-200">₹{formatINR(safeCurrentSavings)}</strong>
            </span>
          </div>
        }
      />

      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Interactive Controls */}
        <div className="space-y-3 lg:col-span-5">
          {/* Monthly SIP Slider */}
          <div className="surface-inset space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-300">Monthly Contribution (SIP)</label>
              <span className="num shrink-0 font-display text-sm font-semibold text-emerald-300">
                ₹{monthlyContribution.toLocaleString('en-IN')}/mo
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              aria-label="Monthly Contribution (SIP)"
              className="pf-range cursor-pointer"
            />
            <div className="flex flex-wrap gap-1.5">
              {[5000, 10000, 20000, 50000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setMonthlyContribution(preset)}
                  aria-pressed={monthlyContribution === preset}
                  className={`num rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    monthlyContribution === preset
                      ? 'border-emerald-400/40 bg-emerald-500/15 font-semibold text-emerald-200'
                      : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/[0.14] hover:text-slate-200'
                  }`}
                >
                  ₹{(preset / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Expected Return Rate */}
          <div className="surface-inset space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-300">Expected Annual CAGR (%)</label>
              <span className="num shrink-0 font-display text-sm font-semibold text-cyan-300">{expectedReturn}% p.a.</span>
            </div>
            <input
              type="range"
              min="4"
              max="20"
              step="0.5"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(Number(e.target.value))}
              aria-label="Expected Annual CAGR (%)"
              className="pf-range cursor-pointer"
            />
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'FD (7%)', val: 7 },
                { label: 'Hybrid (10%)', val: 10 },
                { label: 'Equity (13%)', val: 13 },
                { label: 'Aggressive (15%)', val: 15 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setExpectedReturn(preset.val)}
                  aria-pressed={expectedReturn === preset.val}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    expectedReturn === preset.val
                      ? 'border-cyan-400/40 bg-cyan-500/15 font-semibold text-cyan-200'
                      : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/[0.14] hover:text-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Horizon */}
          <div className="surface-inset space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-300">Time Horizon</label>
              <span className="num shrink-0 font-display text-sm font-semibold text-primary-200">{years} Years</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              aria-label="Time Horizon"
              className="pf-range cursor-pointer"
            />
            <div className="flex flex-wrap gap-1.5">
              {[3, 5, 10, 15, 20].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setYears(yr)}
                  aria-pressed={years === yr}
                  className={`num rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    years === yr
                      ? 'border-primary-400/45 bg-primary-500/15 font-semibold text-primary-100'
                      : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/[0.14] hover:text-slate-200'
                  }`}
                >
                  {yr} Yrs
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Chart & Highlights */}
        <div className="flex min-w-0 flex-col justify-between space-y-4 lg:col-span-7">
          {/* Summary Stat Pills */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <div className="surface-inset min-w-0 p-3">
              <p className="text-[11px] text-slate-400">Total Invested</p>
              <p className="kpi-value mt-1 break-words text-sm text-slate-100 sm:text-base">
                ₹{formatINR(finalInvested)}
              </p>
            </div>

            <div className="surface-inset min-w-0 p-3">
              <p className="text-[11px] text-emerald-300/90">Compound Returns</p>
              <p className="kpi-value mt-1 break-words text-sm text-emerald-300 sm:text-base">
                +₹{formatINR(finalInterestGained)}
              </p>
            </div>

            <div className="col-span-2 min-w-0 rounded-[0.875rem] border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.14] via-emerald-500/[0.04] to-transparent p-3 shadow-[0_12px_30px_-20px_rgba(16,185,129,0.7)] sm:col-span-1">
              <p className="text-[11px] font-medium text-slate-300">Future Portfolio</p>
              <p className="kpi-value text-gradient-emerald mt-1 break-words text-base sm:text-lg">
                ₹{formatINR(finalWealth)}
              </p>
            </div>
          </div>

          {/* Interactive Area Chart */}
          <div className="h-56 w-full pt-2 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.positive} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={chartColors.positive} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.cyan} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={chartColors.cyan} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="year" {...axisProps} />
                <YAxis
                  {...axisProps}
                  tick={{ ...axisTick, fontSize: 10 }}
                  tickFormatter={(val) =>
                    val >= 10000000
                      ? `₹${(val / 10000000).toFixed(1)}Cr`
                      : val >= 100000
                      ? `₹${(val / 100000).toFixed(0)}L`
                      : `₹${val}`
                  }
                />
                <Tooltip
                  cursor={tooltipCursor}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const wealthVal = payload[0]?.value || 0
                      const investedVal = payload[1]?.value || 0
                      return (
                        <ChartTooltipCard
                          title={label}
                          rows={[
                            { label: 'Future Value', value: `₹${formatINR(wealthVal)}`, color: chartColors.positive },
                            { label: 'Principal Invested', value: `₹${formatINR(investedVal)}`, color: chartColors.cyan },
                          ]}
                        />
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="wealth"
                  stroke={chartColors.positive}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#wealthGradient)"
                  activeDot={{ ...activeDot, fill: chartColors.positive }}
                  isAnimationActive={!reduceMotion}
                />
                <Area
                  type="monotone"
                  dataKey="invested"
                  stroke={chartColors.cyan}
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#investedGradient)"
                  activeDot={{ ...activeDot, fill: chartColors.cyan }}
                  isAnimationActive={!reduceMotion}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick takeaway tip */}
          <div className="surface-inset flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Zap className="h-3.5 w-3.5 text-amber-300" />
              Wealth Multiplier:
            </span>
            <span className="num font-semibold text-emerald-300">
              {finalInvested > 0 ? `${(finalWealth / finalInvested).toFixed(2)}x of total capital invested` : '1.0x'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
