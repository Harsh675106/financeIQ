'use client'

import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Check, PieChart as PieIcon, Scale, Target } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { formatINR } from '@/lib/formatters'
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

export default function AllocationStudio({ rows, totalValue, profile, suggestions, band = 5 }: Props) {
  const [active, setActive] = useState<AssetBucket | null>(null)
  const animatedTotal = useCountUp(totalValue, { duration: 1100 })

  const funded = rows.filter((r) => r.value > 0)
  const chartData = funded.length > 0 ? funded : []

  if (totalValue <= 0) {
    return (
      <div className="pf-panel pf-rise p-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-500/10 text-primary-400">
            <PieIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-50">Allocation Studio</h2>
            <p className="text-xs text-slate-400">Asset class distribution vs target</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/60">
            <PieIcon className="h-6 w-6 text-slate-500" />
          </div>
          <p className="text-sm font-semibold text-slate-300">No holdings yet</p>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            Add assets and savings on the Wealth page and your live allocation, risk profile and projections will
            build themselves here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="pf-panel pf-sheen pf-rise p-5 sm:p-6" style={{ animationDelay: '80ms' }}>
      {/* ---------- Header ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="pf-orbit icon-morph-container flex h-9 w-9 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-500/10 text-primary-400">
            <PieIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-50">Allocation Studio</h2>
            <p className="text-xs text-slate-400">Live distribution vs your target mix</p>
          </div>
        </div>

        <span className="chip bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/30">
          <Scale className="h-3.5 w-3.5" />
          {profile.diversification}% diversified
        </span>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        {/* ---------- Donut ---------- */}
        <div className="relative mx-auto flex h-56 w-full max-w-[240px] items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={64}
                outerRadius={92}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                isAnimationActive
                animationDuration={900}
                animationBegin={120}
                onMouseEnter={(_: any, index: number) => setActive(chartData[index]?.bucket ?? null)}
                onMouseLeave={() => setActive(null)}
              >
                {chartData.map((row) => (
                  <Cell
                    key={row.bucket}
                    fill={row.color}
                    stroke="#020617"
                    strokeWidth={2}
                    className="cursor-pointer transition-all duration-300"
                    style={{
                      opacity: active && active !== row.bucket ? 0.35 : 1,
                      transform: active === row.bucket ? 'scale(1.04)' : 'scale(1)',
                      transformOrigin: 'center',
                      filter: active === row.bucket ? `drop-shadow(0 0 10px ${row.color}aa)` : 'none',
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
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: row.color }}>
                      {ASSET_CLASS_MODEL[row.bucket].short}
                    </p>
                    <p className="mt-0.5 text-lg font-extrabold text-slate-50">{row.currentPct.toFixed(1)}%</p>
                    <p className="text-[11px] font-semibold text-slate-400">₹{formatINR(row.value)}</p>
                  </div>
                )
              })()
            ) : (
              <div className="pf-donut-center px-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Value</p>
                <p className="mt-0.5 text-lg font-extrabold text-slate-50">₹{formatINR(animatedTotal)}</p>
                <p className="text-[11px] font-semibold text-slate-500">{funded.length} asset classes</p>
              </div>
            )}
          </div>
        </div>

        {/* ---------- Drift bars ---------- */}
        <div className="space-y-3.5">
          {rows.map((row, i) => {
            const offBand = Math.abs(row.drift) > band
            const width = Math.min(100, Math.max(row.currentPct, 0))
            const targetLeft = Math.min(100, Math.max(row.targetPct, 0))

            return (
              <div
                key={row.bucket}
                onMouseEnter={() => setActive(row.bucket)}
                onMouseLeave={() => setActive(null)}
                className={`rounded-xl border p-3 transition-all duration-200 ${
                  active === row.bucket
                    ? 'border-primary-500/40 bg-slate-900/80'
                    : 'border-slate-800/70 bg-slate-950/50 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                    <span className="truncate text-xs font-bold text-slate-200">{row.label}</span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">{row.currentPct.toFixed(1)}%</span>
                    <span className="text-[11px] text-slate-500">/ {row.targetPct.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Track: filled = current, marker = target */}
                <div className="relative mt-2.5 h-2 rounded-full bg-slate-800/80">
                  <div
                    className={`pf-bar h-full ${offBand ? 'pf-bar-flow' : ''}`}
                    style={{
                      width: `${width}%`,
                      backgroundColor: row.color,
                      animationDelay: `${160 + i * 90}ms`,
                      boxShadow: `0 0 10px ${row.color}66`,
                    }}
                  />
                  <span
                    className="pf-target-marker"
                    style={{ left: `${targetLeft}%`, animationDelay: `${420 + i * 90}ms` }}
                    title={`Target ${row.targetPct.toFixed(0)}%`}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">₹{formatINR(row.value)}</span>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                      !offBand
                        ? 'text-slate-500'
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
      <div className="mt-5 border-t border-slate-800/70 pt-4">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary-300" />
          <h3 className="text-sm font-bold text-slate-100">Rebalancing Actions</h3>
          <span className="text-[11px] text-slate-500">± {band} pp tolerance band</span>
        </div>

        {suggestions.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-primary-500/20 bg-primary-500/5 p-3">
            <Check className="h-4 w-4 shrink-0 text-primary-400" />
            <p className="text-xs text-slate-300">
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
                  className="pf-ladder-row flex items-center justify-between gap-3 rounded-xl border border-slate-800/70 bg-slate-950/60 p-3"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        isSell ? 'bg-amber-500/15 text-amber-300' : 'bg-primary-500/15 text-primary-300'
                      }`}
                    >
                      {isSell ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold capitalize text-slate-100">
                        {s.action} {meta?.short ?? s.bucket}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {isSell ? 'Trim back toward target' : 'Top up toward target'}
                      </p>
                    </div>
                  </div>

                  <span className={`shrink-0 text-sm font-extrabold ${isSell ? 'text-amber-300' : 'text-primary-300'}`}>
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
