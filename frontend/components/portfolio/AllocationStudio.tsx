'use client'

import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Check, PieChart as PieIcon, Scale, Target } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { formatINR } from '@/lib/formatters'
import { chartColors, chartPalette } from '@/lib/chartTheme'
import EmptyState from '@/components/ui/EmptyState'
import { ASSET_CLASS_MODEL, compactINR, type AssetBucket, type BlendedProfile } from '@/lib/portfolioMath'

export interface BucketRow {
  bucket: AssetBucket
  label: string
  color: string
  value: number
  currentPct: number
  targetPct: number
  /** currentPct − targetPct, in percentage points. */
  drift: number
}

export interface RebalanceSuggestion {
  action: 'buy' | 'sell'
  bucket: string
  amount: number
}

interface Props {
  rows: BucketRow[]
  totalValue: number
  profile: BlendedProfile
  suggestions: RebalanceSuggestion[]
  /** Drift tolerance band used by the rebalancing engine, in percentage points. */
  band?: number
}

/** Display colours for each asset class, drawn from the shared categorical chart palette. */
const BUCKET_COLORS: Record<AssetBucket, string> = {
  equity: chartPalette[0],
  debt: chartPalette[1],
  gold: chartPalette[4],
  liquid: chartPalette[2],
}

const colorOf = (row: BucketRow) => BUCKET_COLORS[row.bucket] ?? row.color

export default function AllocationStudio({ rows, totalValue, profile, suggestions, band = 5 }: Props) {
  const [active, setActive] = useState<AssetBucket | null>(null)
  const animatedTotal = useCountUp(totalValue, { duration: 1100 })
  const reduceMotion = useReducedMotion()

  const funded = rows.filter((r) => r.value > 0)
  const chartData = funded.length > 0 ? funded : []

  if (totalValue <= 0) {
    return (
      <div className="pf-panel pf-rise p-5 sm:p-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile icon-tile-brand">
            <PieIcon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title truncate">Allocation Studio</h2>
            <p className="card-subtitle">Asset class distribution vs target</p>
          </div>
        </div>

        <EmptyState
          icon={PieIcon}
          tone="slate"
          title="No holdings yet"
          description="Add assets and savings on the Wealth page and your live allocation, risk profile and projections will build themselves here."
          className="mt-4"
        />
      </div>
    )
  }

  return (
    <div className="pf-panel pf-sheen pf-rise p-5 sm:p-6" style={{ animationDelay: '80ms' }}>
      {/* ---------- Header ---------- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="pf-orbit icon-tile icon-tile-brand icon-morph-container">
            <PieIcon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title truncate">Allocation Studio</h2>
            <p className="card-subtitle">Live distribution vs your target mix</p>
          </div>
        </div>

        <span className="badge badge-brand self-start px-3 py-1 sm:self-auto">
          <Scale className="h-3.5 w-3.5" />
          {profile.diversification}% diversified
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        {/* ---------- Donut ---------- */}
        <div className="relative mx-auto flex h-56 w-full max-w-[240px] items-center justify-center sm:h-60">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-6 rounded-full bg-primary-500/10 blur-2xl"
          />
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={64}
                outerRadius={92}
                paddingAngle={3}
                cornerRadius={4}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                isAnimationActive={!reduceMotion}
                animationDuration={900}
                animationBegin={120}
                onMouseEnter={(_: any, index: number) => setActive(chartData[index]?.bucket ?? null)}
                onMouseLeave={() => setActive(null)}
              >
                {chartData.map((row) => (
                  <Cell
                    key={row.bucket}
                    fill={colorOf(row)}
                    stroke={chartColors.surface}
                    strokeWidth={2}
                    className="cursor-pointer transition-[opacity,transform,filter] duration-300"
                    style={{
                      opacity: active && active !== row.bucket ? 0.35 : 1,
                      transform: !reduceMotion && active === row.bucket ? 'scale(1.04)' : 'scale(1)',
                      transformOrigin: 'center',
                      filter: active === row.bucket ? `drop-shadow(0 0 10px ${colorOf(row)}aa)` : 'none',
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Centre readout follows the hovered slice */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {active ? (
              (() => {
                const row = rows.find((r) => r.bucket === active)!
                return (
                  <div className="pf-donut-center px-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: colorOf(row) }}>
                      {ASSET_CLASS_MODEL[row.bucket].short}
                    </p>
                    <p className="kpi-value mt-0.5 text-xl">{row.currentPct.toFixed(1)}%</p>
                    <p className="num text-[11px] font-medium text-slate-400">₹{formatINR(row.value)}</p>
                  </div>
                )
              })()
            ) : (
              <div className="pf-donut-center px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Total Value</p>
                <p className="kpi-value mt-0.5 text-lg">₹{formatINR(animatedTotal)}</p>
                <p className="text-[11px] font-medium text-slate-500">{funded.length} asset classes</p>
              </div>
            )}
          </div>
        </div>

        {/* ---------- Drift bars ---------- */}
        <div className="min-w-0 space-y-3">
          {rows.map((row, i) => {
            const offBand = Math.abs(row.drift) > band
            const width = Math.min(100, Math.max(row.currentPct, 0))
            const targetLeft = Math.min(100, Math.max(row.targetPct, 0))
            const color = colorOf(row)

            return (
              <div
                key={row.bucket}
                onMouseEnter={() => setActive(row.bucket)}
                onMouseLeave={() => setActive(null)}
                className={`surface-inset surface-inset-hover p-3 sm:p-3.5 ${
                  active === row.bucket ? 'border-primary-400/40 bg-white/[0.05]' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}99` }}
                    />
                    <span className="truncate text-xs font-semibold text-slate-200 sm:text-[13px]">{row.label}</span>
                  </div>

                  <div className="flex shrink-0 items-baseline gap-1.5">
                    <span className="num text-sm font-semibold text-white">{row.currentPct.toFixed(1)}%</span>
                    <span className="num text-[11px] text-slate-500">/ {row.targetPct.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Track: filled = current, marker = target */}
                <div className="relative mt-2.5 h-2 rounded-full bg-white/[0.06] shadow-[inset_0_1px_1px_rgba(0,0,0,0.3)]">
                  <div
                    className={`pf-bar h-full ${offBand ? 'pf-bar-flow' : ''}`}
                    style={{
                      width: `${width}%`,
                      backgroundImage: `linear-gradient(90deg, ${color}99, ${color})`,
                      backgroundColor: color,
                      animationDelay: `${160 + i * 90}ms`,
                      boxShadow: `0 0 12px -2px ${color}aa`,
                    }}
                  />
                  <span
                    className="pf-target-marker"
                    style={{ left: `${targetLeft}%`, animationDelay: `${420 + i * 90}ms` }}
                    title={`Target ${row.targetPct.toFixed(0)}%`}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="num truncate text-[11px] font-medium text-slate-400">₹{formatINR(row.value)}</span>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold ${
                      !offBand
                        ? 'text-emerald-300/80'
                        : row.drift > 0
                          ? 'text-amber-300'
                          : 'text-sky-300'
                    }`}
                  >
                    {!offBand ? (
                      <>
                        <Check className="h-3 w-3" /> on target
                      </>
                    ) : row.drift > 0 ? (
                      <>
                        <ArrowUpRight className="h-3 w-3" /> +{row.drift.toFixed(1)} pp over
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-3 w-3" /> {row.drift.toFixed(1)} pp under
                      </>
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ---------- Rebalancing actions ---------- */}
      <div className="mt-6 border-t border-white/[0.06] pt-5">
        <div className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="icon-tile icon-tile-sm icon-tile-brand">
            <Target className="h-4 w-4" />
          </span>
          <h3 className="font-display text-sm font-semibold text-slate-100">Rebalancing Actions</h3>
          <span className="text-[11px] text-slate-500">± {band} pp tolerance band</span>
        </div>

        {suggestions.length === 0 ? (
          <div className="flex items-center gap-3 rounded-[0.875rem] border border-emerald-400/20 bg-emerald-500/[0.06] p-3">
            <span className="icon-tile icon-tile-sm icon-tile-emerald">
              <Check className="h-4 w-4" />
            </span>
            <p className="text-xs leading-relaxed text-slate-300">
              Every asset class sits inside the ±{band} pp band — no trades needed right now.
            </p>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {suggestions.map((s, i) => {
              const isSell = s.action === 'sell'
              const meta = ASSET_CLASS_MODEL[s.bucket as AssetBucket]
              return (
                <div
                  key={`${s.action}-${s.bucket}-${i}`}
                  className="pf-ladder-row surface-inset surface-inset-hover flex items-center justify-between gap-3 p-3"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`icon-tile icon-tile-sm ${isSell ? 'icon-tile-amber' : 'icon-tile-brand'}`}>
                      {isSell ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold capitalize text-slate-100">
                        {s.action} {meta?.short ?? s.bucket}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {isSell ? 'Trim back toward target' : 'Top up toward target'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`num shrink-0 font-display text-sm font-semibold ${
                      isSell ? 'text-amber-300' : 'text-primary-200'
                    }`}
                  >
                    {compactINR(s.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
