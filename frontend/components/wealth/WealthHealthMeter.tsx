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
import { safeNumber, formatINR, formatINRAmount, formatPercent } from '@/lib/formatters'
import SectionHeader from '@/components/ui/SectionHeader'
import { chartColors } from '@/lib/chartTheme'

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

  // Clean numeric conversions
  const safeSavings = Math.max(0, safeNumber(totalSavings, 0))
  const safeDebts = Math.max(0, safeNumber(totalDebts, 0))
  const safeAssets = Math.max(0, safeNumber(totalAssets, 0))
  const safeLiabilities = Math.max(0, safeNumber(totalLiabilities, 0))

  // Solvency Calculations
  const grossAssets = safeAssets + safeSavings
  const grossDebts = safeDebts + safeLiabilities
  const netWorth = grossAssets - grossDebts

  // Debt to Asset Ratio (%)
  let rawLeverage = 0
  if (grossAssets > 0) {
    rawLeverage = (grossDebts / grossAssets) * 100
  } else if (grossDebts > 0) {
    rawLeverage = 100
  }
  const leverageRatio = Math.max(0, safeNumber(rawLeverage, 0))

  // Savings to Debt Buffer Ratio
  const savingsToDebtRatio = grossDebts > 0 ? (safeSavings / grossDebts) * 100 : 100
  const cleanSavingsToDebtRatio = Math.max(0, safeNumber(savingsToDebtRatio, 100))

  // Health Score (0 - 100)
  let score = 50
  if (grossAssets > 0) {
    if (leverageRatio === 0) score += 35
    else if (leverageRatio < 20) score += 30
    else if (leverageRatio < 40) score += 20
    else if (leverageRatio < 60) score += 5
    else score -= 25
  } else if (grossDebts > 0) {
    score -= 30
  }

  if (safeSavings > 50000) score += 15
  else if (safeSavings > 10000) score += 10
  else if (safeSavings === 0 && grossDebts > 0) score -= 15

  // Bound score
  const healthScore = Math.max(10, Math.min(100, Math.round(safeNumber(score, 50))))

  // Health status
  let healthLabel = 'Moderate Position'
  let healthColor = 'text-amber-300'
  let strokeColor: string = chartColors.warning
  let healthBg = 'from-amber-500/[0.12] via-amber-500/[0.04] to-transparent'
  let badgeBorder = 'border-amber-400/25'

  if (healthScore >= 75) {
    healthLabel = 'Financial Fortress'
    healthColor = 'text-emerald-300'
    strokeColor = chartColors.positive
    healthBg = 'from-emerald-500/[0.12] via-emerald-500/[0.04] to-transparent'
    badgeBorder = 'border-emerald-400/25'
  } else if (healthScore < 45) {
    healthLabel = 'High Debt Exposure'
    healthColor = 'text-rose-300'
    strokeColor = chartColors.negative
    healthBg = 'from-rose-500/[0.12] via-rose-500/[0.04] to-transparent'
    badgeBorder = 'border-rose-400/25'
  }

  // SVG circular gauge math
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (circumference * healthScore) / 100

  return (
    <div className="card card-pad stage-card-lift relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-[0.14] blur-3xl"
        style={{ backgroundColor: strokeColor }}
      />

      {/* Header bar */}
      <SectionHeader
        as="h3"
        icon={ShieldCheck}
        tone="brand"
        className="relative mb-6 border-b border-white/[0.06] pb-5"
        title={
          <span className="flex flex-wrap items-center gap-2 whitespace-normal">
            Wealth Health & Fortress Index
            <span className="badge badge-ai">
              <Sparkles className="h-3.5 w-3.5" />
              AI Diagnostic
            </span>
          </span>
        }
        subtitle="Live solvency resilience & balance sheet stability index"
        actions={
          <div className="scroll-thin max-w-full overflow-x-auto">
            <div className="segmented">
              <button
                onClick={() => setActiveView('score')}
                aria-pressed={activeView === 'score'}
                className={`segmented-item ${activeView === 'score' ? 'segmented-item-active' : ''}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveView('ratios')}
                aria-pressed={activeView === 'ratios'}
                className={`segmented-item ${activeView === 'ratios' ? 'segmented-item-active' : ''}`}
              >
                Ratios & Solvency
              </button>
              <button
                onClick={() => setActiveView('tips')}
                aria-pressed={activeView === 'tips'}
                className={`segmented-item ${activeView === 'tips' ? 'segmented-item-active' : ''}`}
              >
                AI Playbook
              </button>
            </div>
          </div>
        }
      />

      {/* VIEW 1: Score & Core Metrics */}
      {activeView === 'score' && (
        <div className="relative grid grid-cols-1 items-center gap-6 md:grid-cols-12 animate-fade-in">
          {/* Circular Gauge */}
          <div className="flex items-center justify-center md:col-span-4">
            <div className="relative flex items-center justify-center">
              <div
                aria-hidden="true"
                className="absolute inset-4 rounded-full opacity-25 blur-2xl"
                style={{ backgroundColor: strokeColor }}
              />
              <svg viewBox="0 0 128 128" className="relative h-36 w-36 -rotate-90" aria-hidden="true">
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/[0.06]"
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
                  className="gauge-progress-circle"
                  style={{ filter: `drop-shadow(0 0 6px ${strokeColor})` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="kpi-value text-3xl">
                  {healthScore}
                  <span className="ml-0.5 text-xs font-normal text-slate-400">/100</span>
                </span>
                <span className={`mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${healthColor}`}>
                  {healthLabel.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Diagnosis */}
          <div className="space-y-3 md:col-span-8">
            <div className={`rounded-2xl border ${badgeBorder} bg-gradient-to-r ${healthBg} p-4`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
                    <span
                      className="absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping"
                      style={{ backgroundColor: strokeColor }}
                    />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: strokeColor }} />
                  </span>
                  <h4 className={`font-display text-sm font-semibold ${healthColor}`}>{healthLabel}</h4>
                </div>
                <span className="text-xs text-slate-300">
                  Net Worth: <strong className={`num font-semibold ${netWorth >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    ₹{formatINR(netWorth)}
                  </strong>
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                {healthScore >= 75
                  ? 'Your assets comfortably outweigh liabilities. You have substantial protection against unexpected shocks and strong compounding capacity.'
                  : healthScore >= 50
                  ? 'Balanced profile. Continuing to pay down high-APR debt while bolstering emergency liquid savings will quickly lift you into fortress territory.'
                  : 'Leverage is high relative to liquid assets. Focus on accelerating high-rate debt reduction and setting aside an emergency liquidity buffer.'}
              </p>
            </div>

            {/* Quick mini-bars */}
            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
              <div className="surface-inset p-3">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate text-slate-400">Debt-to-Asset Leverage</span>
                  <span className="num shrink-0 font-semibold text-slate-100">{Math.round(leverageRatio)}%</span>
                </div>
                <div className="progress-track h-1.5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ${
                      leverageRatio > 50
                        ? 'from-rose-500 to-pink-400'
                        : leverageRatio > 30
                        ? 'from-amber-400 to-orange-400'
                        : 'from-emerald-400 to-teal-300'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, leverageRatio))}%` }}
                  />
                </div>
              </div>

              <div className="surface-inset p-3">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate text-slate-400">Liquid Savings Shield</span>
                  <span className="num shrink-0 font-semibold text-emerald-300">
                    ₹{formatINR(safeSavings)}
                  </span>
                </div>
                <div className="progress-track h-1.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-[width] duration-700"
                    style={{
                      width: `${Math.min(100, Math.max(0, (safeSavings / (grossDebts > 0 ? grossDebts : 100000)) * 100))}%`
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
        <div className="relative grid grid-cols-1 gap-3 animate-fade-in sm:grid-cols-3">
          <div className="surface-inset space-y-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400">Leverage (D/A)</span>
              <span
                className={`badge uppercase ${
                  leverageRatio <= 30
                    ? 'badge-success'
                    : leverageRatio <= 50
                    ? 'badge-warning'
                    : 'badge-danger'
                }`}
              >
                {leverageRatio <= 30 ? 'Prime' : leverageRatio <= 50 ? 'Moderate' : 'Stretched'}
              </span>
            </div>
            <p className="kpi-value text-xl sm:text-2xl">{Math.round(leverageRatio)}%</p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Ideal threshold is below 35% to maintain flexibility and credit strength.
            </p>
          </div>

          <div className="surface-inset space-y-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400">Solvency Spread</span>
              <span className={`badge uppercase ${grossAssets >= grossDebts ? 'badge-success' : 'badge-danger'}`}>
                {grossAssets >= grossDebts ? 'Positive' : 'Deficit'}
              </span>
            </div>
            <p className="kpi-value break-words text-xl sm:text-2xl">
              ₹{formatINR(Math.abs(grossAssets - grossDebts))}
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              {grossAssets >= grossDebts
                ? 'Net surplus assets working for your passive wealth compound.'
                : 'Deficit gap to eliminate to achieve financial equilibrium.'}
            </p>
          </div>

          <div className="surface-inset space-y-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400">Liquid Coverage</span>
              <span className="badge badge-info uppercase">
                Instant Cash
              </span>
            </div>
            <p className="kpi-value break-words text-xl text-cyan-200 sm:text-2xl">
              ₹{formatINR(safeSavings)}
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              {safeSavings > 100000
                ? 'Healthy cash reserves ready for immediate opportunities.'
                : 'Grow liquid savings to at least 3 months of baseline expenses.'}
            </p>
          </div>
        </div>
      )}

      {/* VIEW 3: AI Playbook Tips */}
      {activeView === 'tips' && (
        <div className="relative space-y-2.5 animate-fade-in">
          <div className="surface-inset flex items-start gap-3 p-3.5">
            <span className="icon-tile icon-tile-sm icon-tile-violet">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div className="min-w-0 text-xs">
              <p className="font-semibold text-slate-100">Accelerate Highest APR First</p>
              <p className="mt-0.5 leading-relaxed text-slate-400">
                Prioritize loans or credit balances exceeding 12% APR (Avalanche method) to minimize lifetime interest friction.
              </p>
            </div>
          </div>

          <div className="surface-inset flex items-start gap-3 p-3.5">
            <span className="icon-tile icon-tile-sm icon-tile-cyan">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div className="min-w-0 text-xs">
              <p className="font-semibold text-slate-100">Automate 20% Compounding Engine</p>
              <p className="mt-0.5 leading-relaxed text-slate-400">
                Channel surplus savings into disciplined SIPs or high-yield deposits right on salary day before discretionary spending.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
