'use client'

import { useCountUp } from '@/hooks/useCountUp'
import { formatINR } from '@/lib/formatters'
import { compactINR, type BlendedProfile } from '@/lib/portfolioMath'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'

interface HeroProps {
  totalValue: number
  investedValue: number
  liquidValue: number
  holdingsCount: number
  profile: BlendedProfile
  monthlySurplus: number
  savingsRate: number
  cashflowMonths: number
  lastUpdated: Date | null
  refreshing: boolean
  onRefresh: () => void
}

interface TileProps {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  accent: string
  tone: string
  delay: number
  trend?: 'up' | 'down' | null
}

function MetricTile({ label, value, sub, icon, accent, tone, delay, trend }: TileProps) {
  return (
    <div className="pf-tile pf-rise p-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className={`mt-1.5 truncate text-xl font-extrabold ${tone}`}>{value}</p>
        </div>
        <div
          className="icon-morph-container flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
          style={{ borderColor: `${accent}40`, backgroundColor: `${accent}1a`, color: accent }}
        >
          {icon}
        </div>
      </div>

      <p className="mt-2 flex items-center gap-1 text-[11px] leading-relaxed text-slate-400">
        {trend === 'up' && <ArrowUpRight className="h-3 w-3 shrink-0 text-primary-400" />}
        {trend === 'down' && <ArrowDownRight className="h-3 w-3 shrink-0 text-danger-400" />}
        <span className="truncate">{sub}</span>
      </p>

      <span className="pf-tile-accent" style={{ backgroundColor: accent }} />
    </div>
  )
}

export default function PortfolioHero({
  totalValue,
  investedValue,
  liquidValue,
  holdingsCount,
  profile,
  monthlySurplus,
  savingsRate,
  cashflowMonths,
  lastUpdated,
  refreshing,
  onRefresh,
}: HeroProps) {
  const animatedTotal = useCountUp(totalValue, { duration: 1200 })
  const animatedReturn = useCountUp(profile.expectedReturn * 100, { duration: 1100, decimals: 1 })

  const riskTone =
    profile.riskLevel === 'Aggressive'
      ? 'text-amber-300'
      : profile.riskLevel === 'Conservative'
        ? 'text-sky-300'
        : 'text-primary-300'

  const investedShare = totalValue > 0 ? Math.round((investedValue / totalValue) * 100) : 0
  const liquidShare = totalValue > 0 ? Math.round((liquidValue / totalValue) * 100) : 0

  return (
    <section className="pf-hero pf-rise p-5 sm:p-7">
      {/* ---------- Title row ---------- */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="live-beacon">
              <span className="relative h-2 w-2 rounded-full bg-primary-400" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-300/90">
              Live Portfolio Intelligence
            </span>
          </div>

          <h1 className="pf-aurora-text mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Portfolio Analysis
          </h1>

          <p className="mt-1.5 max-w-xl text-sm text-slate-400">
            Allocation, risk and Monte Carlo projections computed from your own holdings, savings and cash flow.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="pf-chip flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-300"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-primary-300' : ''}`} />
          {refreshing ? 'Syncing' : 'Refresh'}
        </button>
      </div>

      {/* ---------- Headline value ---------- */}
      <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Portfolio Value
          </p>
          <p className="metric-counter-glow mt-1 text-4xl font-extrabold text-slate-50 sm:text-5xl">
            ₹{formatINR(animatedTotal)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pb-2">
          <span className="chip bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/30">
            <Layers className="h-3.5 w-3.5" />
            {holdingsCount} holding{holdingsCount === 1 ? '' : 's'}
          </span>
          <span className={`chip bg-slate-900/80 ring-1 ring-slate-700 ${riskTone}`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            {profile.riskLevel} · {(profile.volatility * 100).toFixed(1)}% vol
          </span>
          {lastUpdated && (
            <span className="chip bg-slate-900/60 text-slate-400 ring-1 ring-slate-800">
              <Activity className="h-3.5 w-3.5" />
              Synced {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* ---------- Metric tiles ---------- */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Invested Assets"
          value={compactINR(investedValue)}
          sub={`${investedShare}% of portfolio in equity, debt and gold`}
          icon={<Sparkles className="h-4 w-4" />}
          accent="#0ea5e9"
          tone="text-sky-300"
          delay={60}
        />
        <MetricTile
          label="Liquid & Savings"
          value={compactINR(liquidValue)}
          sub={`${liquidShare}% held as cash, deposits and savings`}
          icon={<Wallet className="h-4 w-4" />}
          accent="#8b5cf6"
          tone="text-purple-300"
          delay={120}
        />
        <MetricTile
          label="Expected Return"
          value={`${animatedReturn.toFixed(1)}%`}
          sub={`Blended from your mix · ${profile.diversification}% diversified`}
          icon={<ArrowUpRight className="h-4 w-4" />}
          accent="#10b981"
          tone="text-primary-300"
          delay={180}
        />
        <MetricTile
          label="Monthly Investable"
          value={compactINR(Math.max(0, monthlySurplus))}
          sub={
            cashflowMonths > 0
              ? `${savingsRate.toFixed(0)}% savings rate over ${cashflowMonths} month${cashflowMonths === 1 ? '' : 's'}`
              : 'Add transactions to compute your surplus'
          }
          icon={<Activity className="h-4 w-4" />}
          accent={monthlySurplus >= 0 ? '#34d399' : '#f87171'}
          tone={monthlySurplus >= 0 ? 'text-emerald-300' : 'text-danger-300'}
          delay={240}
          trend={cashflowMonths > 0 ? (monthlySurplus >= 0 ? 'up' : 'down') : null}
        />
      </div>
    </section>
  )
}
