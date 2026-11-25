'use client'

import { useCountUp } from '@/hooks/useCountUp'
import { formatINR } from '@/lib/formatters'
import { compactINR, type BlendedProfile } from '@/lib/portfolioMath'
import { chartColors } from '@/lib/chartTheme'
import PageHeader from '@/components/ui/PageHeader'
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
    <div className="pf-tile pf-rise min-w-0 p-4 sm:p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow truncate">{label}</p>
          <p className={`kpi-value mt-2 truncate text-xl sm:text-2xl ${tone}`}>{value}</p>
        </div>
        <span
          className="icon-morph-container flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            color: `color-mix(in srgb, ${accent} 78%, ${chartColors.text})`,
            background: `linear-gradient(145deg, ${accent}1f, ${accent}0a)`,
            boxShadow: `inset 0 0 0 1px ${accent}33, 0 6px 14px -10px ${accent}80`,
          }}
        >
          {icon}
        </span>
      </div>

      <p className="mt-3 flex items-center gap-1 text-xs leading-relaxed text-slate-500">
        {trend === 'up' && <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
        {trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5 shrink-0 text-rose-600" />}
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
      ? 'badge-warning'
      : profile.riskLevel === 'Conservative'
        ? 'badge-info'
        : 'badge-brand'

  const investedShare = totalValue > 0 ? Math.round((investedValue / totalValue) * 100) : 0
  const liquidShare = totalValue > 0 ? Math.round((liquidValue / totalValue) * 100) : 0

  return (
    <section className="pf-hero pf-rise p-5 sm:p-7 lg:p-8">
      {/* ---------- Title row ---------- */}
      <PageHeader
        eyebrow={
          <>
            <span className="live-beacon">
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live Portfolio Intelligence
          </>
        }
        title={<span className="pf-aurora-text">Portfolio Analysis</span>}
        description="Allocation, risk and Monte Carlo projections computed from your own holdings, savings and cash flow."
        actions={
          <button onClick={onRefresh} disabled={refreshing} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-primary-600' : ''}`} />
            {refreshing ? 'Syncing' : 'Refresh'}
          </button>
        }
      />

      <div className="divider mt-6 sm:mt-7" />

      {/* ---------- Headline value ---------- */}
      <div className="mt-6 flex flex-col gap-4 sm:mt-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Total Portfolio Value</p>
          <p className="kpi-value metric-counter-glow mt-2 break-words text-[2.25rem] leading-none sm:text-5xl">
            ₹{formatINR(animatedTotal)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-brand px-3 py-1">
            <Layers className="h-3.5 w-3.5" />
            {holdingsCount} holding{holdingsCount === 1 ? '' : 's'}
          </span>
          <span className={`badge px-3 py-1 ${riskTone}`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            {profile.riskLevel} · {(profile.volatility * 100).toFixed(1)}% vol
          </span>
          {lastUpdated && (
            <span className="badge badge-neutral px-3 py-1">
              <Activity className="h-3.5 w-3.5" />
              Synced {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* ---------- Metric tiles ---------- */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <MetricTile
          label="Invested Assets"
          value={compactINR(investedValue)}
          sub={`${investedShare}% of portfolio in equity, debt and gold`}
          icon={<Sparkles className="h-4 w-4" />}
          accent={chartColors.brand}
          tone="text-primary-700"
          delay={60}
        />
        <MetricTile
          label="Liquid & Savings"
          value={compactINR(liquidValue)}
          sub={`${liquidShare}% held as cash, deposits and savings`}
          icon={<Wallet className="h-4 w-4" />}
          accent={chartColors.ice}
          tone="text-ice-700"
          delay={120}
        />
        <MetricTile
          label="Expected Return"
          value={`${animatedReturn.toFixed(1)}%`}
          sub={`Blended from your mix · ${profile.diversification}% diversified`}
          icon={<ArrowUpRight className="h-4 w-4" />}
          accent={chartColors.violet}
          tone="text-indigo-600"
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
          accent={monthlySurplus >= 0 ? chartColors.positive : chartColors.negative}
          tone={monthlySurplus >= 0 ? 'text-emerald-700' : 'text-rose-600'}
          delay={240}
          trend={cashflowMonths > 0 ? (monthlySurplus >= 0 ? 'up' : 'down') : null}
        />
      </div>
    </section>
  )
}
