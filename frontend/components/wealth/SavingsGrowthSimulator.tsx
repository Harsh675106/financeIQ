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
        className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-ice-100/60 blur-3xl"
      />

      {/* Header */}
      <SectionHeader
        as="h3"
        icon={TrendingUp}
        tone="sky"
        className="relative mb-6 border-b border-line pb-5"
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
            <PiggyBank className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="text-xs text-slate-500">
              Current Reserve: <strong className="num font-semibold text-emerald-700">₹{formatINR(safeCurrentSavings)}</strong>
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
              <label className="text-xs font-semibold text-ink-700">Monthly Contribution (SIP)</label>
              <span className="num shrink-0 font-display text-sm font-semibold text-emerald-700">
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
                      ? 'border-emerald-200 bg-emerald-50 font-semibold text-emerald-700'
                      : 'border-line-strong bg-white text-slate-600 hover:border-slate-300 hover:text-ink-900'
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
              <label className="text-xs font-semibold text-ink-700">Expected Annual CAGR (%)</label>
              <span className="num shrink-0 font-display text-sm font-semibold text-sky-700">{expectedReturn}% p.a.</span>
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
                      ? 'border-sky-200 bg-sky-50 font-semibold text-sky-700'
                      : 'border-line-strong bg-white text-slate-600 hover:border-slate-300 hover:text-ink-900'
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
              <label className="text-xs font-semibold text-ink-700">Time Horizon</label>
              <span className="num shrink-0 font-display text-sm font-semibold text-primary-700">{years} Years</span>
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
                      ? 'border-primary-200 bg-primary-50 font-semibold text-primary-700'
                      : 'border-line-strong bg-white text-slate-600 hover:border-slate-300 hover:text-ink-900'
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
              <p className="text-[11px] text-slate-500">Total Invested</p>
              <p className="kpi-value mt-1 break-words text-sm text-ink-900 sm:text-base">
                ₹{formatINR(finalInvested)}
              </p>
            </div>

            <div className="surface-inset min-w-0 p-3">
              <p className="text-[11px] font-medium text-emerald-700">Compound Returns</p>
              <p className="kpi-value mt-1 break-words text-sm text-emerald-700 sm:text-base">
                +₹{formatINR(finalInterestGained)}
              </p>
            </div>

            <div className="col-span-2 min-w-0 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-ice-50 p-3 shadow-xs sm:col-span-1">
              <p className="text-[11px] font-medium text-slate-600">Future Portfolio</p>
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
                    <stop offset="5%" stopColor={chartColors.positive} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={chartColors.ice} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.ice} stopOpacity={0.14} />
                    <stop offset="95%" stopColor={chartColors.ice} stopOpacity={0.0} />
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
                            { label: 'Principal Invested', value: `₹${formatINR(investedVal)}`, color: chartColors.iceStrong },
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
                  stroke={chartColors.iceStrong}
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#investedGradient)"
                  activeDot={{ ...activeDot, fill: chartColors.iceStrong }}
                  isAnimationActive={!reduceMotion}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick takeaway tip */}
          <div className="surface-inset flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-xs">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Wealth Multiplier:
            </span>
            <span className="num font-semibold text-emerald-700">
              {finalInvested > 0 ? `${(finalWealth / finalInvested).toFixed(2)}x of total capital invested` : '1.0x'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
