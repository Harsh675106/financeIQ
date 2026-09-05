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

interface SavingsGrowthSimulatorProps {
  currentSavings: number
}

export default function SavingsGrowthSimulator({ currentSavings }: SavingsGrowthSimulatorProps) {
  const [monthlyContribution, setMonthlyContribution] = useState(15000)
  const [expectedReturn, setExpectedReturn] = useState(12) // 12% CAGR
  const [years, setYears] = useState(10)
  const [initialAmount, setInitialAmount] = useState(currentSavings > 0 ? Math.round(currentSavings) : 50000)

  // Calculate year-by-year compounding projection
  const projectionData = useMemo(() => {
    const data = []
    const monthlyRate = expectedReturn / 100 / 12
    let currentBalance = initialAmount
    let totalInvested = initialAmount

    data.push({
      year: 'Year 0',
      invested: Math.round(totalInvested),
      wealth: Math.round(currentBalance),
      interest: 0,
    })

    for (let yr = 1; yr <= years; yr++) {
      for (let m = 0; m < 12; m++) {
        currentBalance = (currentBalance + monthlyContribution) * (1 + monthlyRate)
        totalInvested += monthlyContribution
      }
      const gains = Math.max(0, currentBalance - totalInvested)
      data.push({
        year: `Y${yr}`,
        invested: Math.round(totalInvested),
        wealth: Math.round(currentBalance),
        interest: Math.round(gains),
      })
    }

    return data
  }, [initialAmount, monthlyContribution, expectedReturn, years])

  const finalState = projectionData[projectionData.length - 1]
  const finalWealth = finalState?.wealth || 0
  const finalInvested = finalState?.invested || 0
  const finalInterestGained = finalState?.interest || 0

  // Emergency Fund milestones (assuming ~₹40k monthly living expense)
  const monthlyExpenseEstimate = 35000
  const runwayMonths = Math.floor(currentSavings / (monthlyExpenseEstimate || 1))

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-slate-600/70">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Compound Growth & Wealth Engine
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-500/20">
                <Sparkles className="h-3 w-3" />
                Live Simulator
              </span>
            </h3>
            <p className="text-xs text-slate-400">Forecast the exponential power of compounding interest</p>
          </div>
        </div>

        {/* Milestone Indicator */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-800/60 px-3 py-1.5 border border-slate-700/50">
          <PiggyBank className="h-4 w-4 text-cyan-400" />
          <span className="text-xs text-slate-300">
            Current Reserve: <strong className="text-cyan-300 font-mono">₹{Math.round(currentSavings).toLocaleString('en-IN')}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Interactive Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Monthly SIP Slider */}
          <div className="space-y-2 rounded-xl bg-slate-800/40 p-3.5 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Monthly Contribution (SIP)</label>
              <span className="font-mono text-sm font-bold text-emerald-400">
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
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-emerald-400 transition"
            />
            <div className="flex gap-1.5 pt-1">
              {[5000, 10000, 20000, 50000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setMonthlyContribution(preset)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition ${
                    monthlyContribution === preset
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                  }`}
                >
                  ₹{(preset / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Expected Return Rate */}
          <div className="space-y-2 rounded-xl bg-slate-800/40 p-3.5 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Expected Annual CAGR (%)</label>
              <span className="font-mono text-sm font-bold text-cyan-400">{expectedReturn}% p.a.</span>
            </div>
            <input
              type="range"
              min="4"
              max="20"
              step="0.5"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-cyan-400 transition"
            />
            <div className="flex gap-1.5 pt-1">
              {[
                { label: 'FD (7%)', val: 7 },
                { label: 'Hybrid (10%)', val: 10 },
                { label: 'Equity (13%)', val: 13 },
                { label: 'Aggressive (15%)', val: 15 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setExpectedReturn(preset.val)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition ${
                    expectedReturn === preset.val
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Horizon */}
          <div className="space-y-2 rounded-xl bg-slate-800/40 p-3.5 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Time Horizon</label>
              <span className="font-mono text-sm font-bold text-purple-400">{years} Years</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-purple-400 transition"
            />
            <div className="flex gap-1.5 pt-1">
              {[3, 5, 10, 15, 20].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setYears(yr)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition ${
                    years === yr
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                  }`}
                >
                  {yr} Yrs
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Chart & Highlights */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Summary Stat Pills */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-[11px] text-slate-400">Total Invested</p>
              <p className="text-sm sm:text-base font-bold text-slate-200 mt-0.5">
                ₹{Math.round(finalInvested).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-[11px] text-emerald-400">Compound Returns</p>
              <p className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">
                +₹{Math.round(finalInterestGained).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-slate-900/80 p-3 shadow-inner">
              <p className="text-[11px] text-slate-300 font-medium">Future Portfolio</p>
              <p className="text-sm sm:text-base font-extrabold text-emerald-300 mt-0.5">
                ₹{Math.round(finalWealth).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Interactive Area Chart */}
          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) =>
                    val >= 10000000
                      ? `₹${(val / 10000000).toFixed(1)}Cr`
                      : val >= 100000
                      ? `₹${(val / 100000).toFixed(0)}L`
                      : `₹${val}`
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const wealthVal = payload[0]?.value || 0
                      const investedVal = payload[1]?.value || 0
                      return (
                        <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md">
                          <p className="font-semibold text-slate-200 text-xs mb-1.5">{label}</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5 text-emerald-400">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                Future Value:
                              </span>
                              <span className="font-bold text-slate-100">
                                ₹{Number(wealthVal).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5 text-cyan-400">
                                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                                Principal Invested:
                              </span>
                              <span className="font-semibold text-slate-300">
                                ₹{Number(investedVal).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="wealth"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#wealthGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="invested"
                  stroke="#06b6d4"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#investedGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick takeaway tip */}
          <div className="flex items-center justify-between rounded-xl bg-slate-800/40 px-3.5 py-2 text-xs border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Wealth Multiplier:
            </span>
            <span className="font-semibold text-emerald-400">
              {finalInvested > 0 ? `${(finalWealth / finalInvested).toFixed(2)}x of total capital invested` : '1.0x'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
