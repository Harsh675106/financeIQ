'use client'

import { useState } from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  Zap,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Info,
  CheckCircle2,
  PieChart
} from 'lucide-react'

interface WealthHealthMeterProps {
  totalSavings: number
  totalDebts: number
  totalAssets: number
  totalLiabilities: number
}

export default function WealthHealthMeter({
  totalSavings,
  totalDebts,
  totalAssets,
  totalLiabilities
}: WealthHealthMeterProps) {
  const [activeView, setActiveView] = useState<'score' | 'ratios' | 'tips'>('score')

  // Calculations
  const grossAssets = totalAssets + totalSavings
  const grossDebts = totalDebts + totalLiabilities
  const netWorth = grossAssets - grossDebts

  // Debt to Asset Ratio (%)
  const leverageRatio = grossAssets > 0 ? (grossDebts / grossAssets) * 100 : grossDebts > 0 ? 100 : 0

  // Savings to Debt Buffer Ratio
  const savingsToDebtRatio = grossDebts > 0 ? (totalSavings / grossDebts) * 100 : 100

  // Health Score (0 - 100)
  let score = 50
  if (grossAssets > 0) {
    if (leverageRatio === 0) score += 35
    else if (leverageRatio < 20) score += 30
    else if (leverageRatio < 40) score += 20
    else if (leverageRatio < 60) score += 5
    else score -= 25
  }
  if (totalSavings > 50000) score += 15
  else if (totalSavings > 10000) score += 10
  else if (totalSavings === 0 && grossDebts > 0) score -= 15

  // Bound score
  const healthScore = Math.max(10, Math.min(100, Math.round(score)))

  // Health status
  let healthLabel = 'Moderate Position'
  let healthColor = 'text-amber-400'
  let strokeColor = '#f59e0b'
  let healthBg = 'from-amber-500/10 to-amber-500/5'
  let badgeBorder = 'border-amber-500/30'

  if (healthScore >= 75) {
    healthLabel = 'Financial Fortress'
    healthColor = 'text-emerald-400'
    strokeColor = '#10b981'
    healthBg = 'from-emerald-500/10 to-emerald-500/5'
    badgeBorder = 'border-emerald-500/30'
  } else if (healthScore < 45) {
    healthLabel = 'High Debt Exposure'
    healthColor = 'text-rose-400'
    strokeColor = '#f43f5e'
    healthBg = 'from-rose-500/10 to-rose-500/5'
    badgeBorder = 'border-rose-500/30'
  }

  // SVG circular gauge math
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (circumference * healthScore) / 100

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950/95 p-6 md:p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 stage-card-lift">
      {/* Background ambient glow */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: strokeColor }}
      />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 shadow-lg">
            <ShieldCheck className="h-6 w-6 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              Wealth Health & Fortress Index
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2.5 py-0.5 text-xs font-semibold text-slate-300 border border-slate-700">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                AI Diagnostic
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Live solvency resilience & balance sheet stability index</p>
          </div>
        </div>

        {/* View toggle pills */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-slate-800/90 p-1.5 border border-slate-700/60 shadow-inner">
          <button
            onClick={() => setActiveView('score')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
              activeView === 'score'
                ? 'bg-emerald-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('ratios')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
              activeView === 'ratios'
                ? 'bg-emerald-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ratios & Solvency
          </button>
          <button
            onClick={() => setActiveView('tips')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
              activeView === 'tips'
                ? 'bg-emerald-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Playbook
          </button>
        </div>
      </div>

      {/* VIEW 1: Score & Core Metrics */}
      {activeView === 'score' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Circular Gauge */}
          <div className="md:col-span-4 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <svg className="h-32 w-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-800"
                />
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke={strokeColor}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black tracking-tight text-slate-50">
                  {healthScore}
                  <span className="text-xs font-normal text-slate-400">/100</span>
                </span>
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${healthColor}`}>
                  {healthLabel.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Diagnosis */}
          <div className="md:col-span-8 space-y-3">
            <div className={`rounded-xl border ${badgeBorder} bg-gradient-to-r ${healthBg} p-3.5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full animate-ping`} style={{ backgroundColor: strokeColor }} />
                  <h4 className={`text-sm font-bold ${healthColor}`}>{healthLabel}</h4>
                </div>
                <span className="text-xs text-slate-300 font-mono">
                  Net Worth: <strong className={netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    ₹{Math.round(netWorth).toLocaleString('en-IN')}
                  </strong>
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                {healthScore >= 75
                  ? 'Your assets comfortably outweigh liabilities. You have substantial protection against unexpected shocks and strong compounding capacity.'
                  : healthScore >= 50
                  ? 'Balanced profile. Continuing to pay down high-APR debt while bolstering emergency liquid savings will quickly lift you into fortress territory.'
                  : 'Leverage is high relative to liquid assets. Focus on accelerating high-rate debt reduction and setting aside an emergency liquidity buffer.'}
              </p>
            </div>

            {/* Quick mini-bars */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Debt-to-Asset Leverage</span>
                  <span className="font-semibold text-slate-200">{Math.round(leverageRatio)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      leverageRatio > 50 ? 'bg-rose-500' : leverageRatio > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, leverageRatio)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Liquid Savings Shield</span>
                  <span className="font-semibold text-emerald-400">
                    ₹{Math.round(totalSavings).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (totalSavings / (grossDebts > 0 ? grossDebts : 100000)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Solvency Ratios Breakdown */}
      {activeView === 'ratios' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Leverage (D/A)</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                  leverageRatio <= 30
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : leverageRatio <= 50
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}
              >
                {leverageRatio <= 30 ? 'Prime' : leverageRatio <= 50 ? 'Moderate' : 'Stretched'}
              </span>
            </div>
            <p className="text-xl font-bold text-slate-100">{Math.round(leverageRatio)}%</p>
            <p className="text-[11px] text-slate-400">
              Ideal threshold is below 35% to maintain flexibility and credit strength.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Solvency Spread</span>
              <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/20 uppercase">
                {grossAssets >= grossDebts ? 'Positive' : 'Deficit'}
              </span>
            </div>
            <p className="text-xl font-bold text-slate-100">
              ₹{Math.round(Math.abs(grossAssets - grossDebts)).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400">
              {grossAssets >= grossDebts
                ? 'Net surplus assets working for your passive wealth compound.'
                : 'Deficit gap to eliminate to achieve financial equilibrium.'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Liquid Coverage</span>
              <span className="rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/20 uppercase">
                Instant Cash
              </span>
            </div>
            <p className="text-xl font-bold text-cyan-300">
              ₹{Math.round(totalSavings).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400">
              {totalSavings > 100000
                ? 'Healthy cash reserves ready for immediate opportunities.'
                : 'Grow liquid savings to at least 3 months of baseline expenses.'}
            </p>
          </div>
        </div>
      )}

      {/* VIEW 3: AI Playbook Tips */}
      {activeView === 'tips' && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-slate-200">Accelerate Highest APR First</p>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Prioritize loans or credit balances exceeding 12% APR (Avalanche method) to minimize lifetime interest friction.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-slate-200">Automate 20% Compounding Engine</p>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Channel surplus savings into disciplined SIPs or high-yield deposits right on salary day before discretionary spending.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
