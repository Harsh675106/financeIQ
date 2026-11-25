'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { AlertTriangle, Brain, CheckCircle2, Info, ShieldAlert, Zap } from 'lucide-react'
import { formatINR, safeNumber } from '@/lib/formatters'
import { compactINR } from '@/lib/portfolioMath'
import { chartColors } from '@/lib/chartTheme'
import EmptyState from '@/components/ui/EmptyState'

const SEVERITY: Record<string, { ring: string; bg: string; text: string; icon: React.ReactNode }> = {
  high: {
    ring: 'border-rose-200',
    bg: 'bg-rose-50/70',
    text: 'text-rose-700',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  medium: {
    ring: 'border-amber-200',
    bg: 'bg-amber-50/70',
    text: 'text-amber-700',
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
  },
  low: {
    ring: 'border-sky-200',
    bg: 'bg-sky-50/70',
    text: 'text-sky-700',
    icon: <Info className="h-3.5 w-3.5" />,
  },
}

export default function PortfolioExplainabilityCard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/portfolio/explainability')
        setData(res.data)
      } catch (error) {
        console.error('Failed to load portfolio explainability', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="pf-skeleton h-52 w-full rounded-[1.25rem]" role="status" aria-label="Loading portfolio explainability" />
    )
  }

  const explanations: any[] = data?.explanations ?? []
  const stressTests: any[] = data?.stressTests ?? []

  return (
    <div className="pf-panel pf-sheen pf-rise p-5 sm:p-6" style={{ animationDelay: '240ms' }}>
      {/* ---------- Header ---------- */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="pf-orbit icon-tile icon-tile-violet icon-morph-container">
            <Brain className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title truncate">AI Portfolio Explainability</h2>
            <p className="card-subtitle">Risks the model found, and how shocks would land</p>
          </div>
        </div>

        {explanations.length > 0 && (
          <span className="badge badge-danger self-start px-3 py-1 sm:self-auto">
            <AlertTriangle className="h-3.5 w-3.5" />
            {explanations.length} finding{explanations.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {!data ? (
        <EmptyState icon={Brain} tone="violet" title="No portfolio explainability available yet." compact />
      ) : (
        <div className="space-y-6">
          {/* ---------- Findings ---------- */}
          <div className="space-y-2.5">
            {explanations.length === 0 ? (
              <div className="flex items-center gap-3 rounded-[0.875rem] border border-emerald-100 bg-emerald-50/70 p-3">
                <span className="icon-tile icon-tile-sm icon-tile-emerald">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <p className="text-xs leading-relaxed text-ink-700">
                  No major allocation, liquidity or leverage mismatch detected right now.
                </p>
              </div>
            ) : (
              explanations.map((item, i) => {
                const tone = SEVERITY[item.severity] ?? SEVERITY.low
                return (
                  <div
                    key={item.type ?? i}
                    className={`pf-ladder-row rounded-[0.875rem] border p-3.5 sm:p-4 ${tone.ring} ${tone.bg}`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className={`flex min-w-0 items-center gap-2 ${tone.text}`}>
                        <span className="shrink-0">{tone.icon}</span>
                        <span className="text-[13px] font-semibold">{item.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="num text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {item.confidence}% confidence
                        </span>
                        <span className={`h-1 w-12 overflow-hidden rounded-full bg-ink-900/[0.08] ${tone.text}`}>
                          <span
                            className="pf-bar block h-full rounded-full"
                            style={{
                              width: `${safeNumber(item.confidence, 0)}%`,
                              backgroundColor: 'currentColor',
                              animationDelay: `${200 + i * 80}ms`,
                            }}
                          />
                        </span>
                      </div>
                    </div>

                    <p className="mt-2 text-xs leading-relaxed text-ink-700">{item.explanation}</p>

                    {Array.isArray(item.assumptions) && item.assumptions.length > 0 && (
                      <p className="mt-1.5 text-[11px] italic leading-relaxed text-slate-500">
                        Assumes: {item.assumptions.join(' ')}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* ---------- Stress tests ---------- */}
          {stressTests.length > 0 && (
            <div className="border-t border-line pt-5">
              <div className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="icon-tile icon-tile-sm icon-tile-sky">
                  <Zap className="h-4 w-4" />
                </span>
                <h3 className="font-display text-sm font-semibold text-ink-900">Scenario Stress Test</h3>
                <span className="text-[11px] text-slate-500">Modelled on your current mix</span>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {stressTests.map((item, i) => {
                  const impact = safeNumber(item.estimatedImpactPercent, 0) * 100
                  const positive = impact >= 0
                  const magnitude = Math.min(100, Math.abs(impact) * 3)

                  return (
                    <div
                      key={item.scenario}
                      className="pf-ladder-row surface-inset surface-inset-hover p-3 sm:p-3.5"
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 text-xs font-semibold text-ink-800">{item.scenario}</span>
                        <span
                          className={`num shrink-0 font-display text-sm font-semibold ${
                            positive ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {positive ? '+' : ''}
                          {impact.toFixed(1)}%
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 rounded-full bg-ink-900/[0.06]">
                        <div
                          className="pf-bar h-full"
                          style={{
                            width: `${magnitude}%`,
                            backgroundColor: positive ? chartColors.positive : chartColors.negative,
                            animationDelay: `${180 + i * 70}ms`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-[11px] text-slate-500">
                        Portfolio lands near{' '}
                        <span className="num font-semibold text-ink-800">
                          {compactINR(item.projectedPortfolioValue)}
                        </span>{' '}
                        (₹{formatINR(item.projectedPortfolioValue)})
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
