'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { AlertTriangle, Brain, CheckCircle2, Info, ShieldAlert, Zap } from 'lucide-react'
import { formatINR, safeNumber } from '@/lib/formatters'
import { compactINR } from '@/lib/portfolioMath'

const SEVERITY: Record<string, { ring: string; bg: string; text: string; icon: React.ReactNode }> = {
  high: {
    ring: 'border-danger-500/30',
    bg: 'bg-danger-500/[0.07]',
    text: 'text-danger-300',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  medium: {
    ring: 'border-amber-500/30',
    bg: 'bg-amber-500/[0.07]',
    text: 'text-amber-300',
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
  },
  low: {
    ring: 'border-primary-500/25',
    bg: 'bg-primary-500/[0.06]',
    text: 'text-primary-300',
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
    return <div className="pf-skeleton h-52 w-full" />
  }

  const explanations: any[] = data?.explanations ?? []
  const stressTests: any[] = data?.stressTests ?? []

  return (
    <div className="pf-panel pf-sheen pf-rise p-5 sm:p-6" style={{ animationDelay: '240ms' }}>
      {/* ---------- Header ---------- */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="pf-orbit icon-morph-container flex h-9 w-9 items-center justify-center rounded-xl border border-purple-500/25 bg-purple-500/10 text-purple-300">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-50">AI Portfolio Explainability</h2>
            <p className="text-xs text-slate-400">Risks the model found, and how shocks would land</p>
          </div>
        </div>

        {explanations.length > 0 && (
          <span className="chip bg-danger-500/10 text-danger-300 ring-1 ring-danger-500/25">
            <AlertTriangle className="h-3.5 w-3.5" />
            {explanations.length} finding{explanations.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {!data ? (
        <p className="text-sm text-slate-400">No portfolio explainability available yet.</p>
      ) : (
        <div className="space-y-5">
          {/* ---------- Findings ---------- */}
          <div className="space-y-2.5">
            {explanations.length === 0 ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-primary-500/20 bg-primary-500/5 p-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-400" />
                <p className="text-xs text-slate-300">
                  No major allocation, liquidity or leverage mismatch detected right now.
                </p>
              </div>
            ) : (
              explanations.map((item, i) => {
                const tone = SEVERITY[item.severity] ?? SEVERITY.low
                return (
                  <div
                    key={item.type ?? i}
                    className={`pf-ladder-row rounded-xl border p-3.5 ${tone.ring} ${tone.bg}`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className={`flex items-center gap-2 ${tone.text}`}>
                        {tone.icon}
                        <span className="text-xs font-bold">{item.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          {item.confidence}% confidence
                        </span>
                        <span className="h-1 w-12 overflow-hidden rounded-full bg-slate-800">
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

                    <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{item.explanation}</p>

                    {Array.isArray(item.assumptions) && item.assumptions.length > 0 && (
                      <p className="mt-1.5 text-[10px] italic leading-relaxed text-slate-500">
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
            <div className="border-t border-slate-800/70 pt-4">
              <div className="mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-300" />
                <h3 className="text-sm font-bold text-slate-100">Scenario Stress Test</h3>
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
                      className="pf-ladder-row rounded-xl border border-slate-800/70 bg-slate-950/50 p-3"
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-200">{item.scenario}</span>
                        <span
                          className={`text-sm font-extrabold ${positive ? 'text-primary-300' : 'text-danger-300'}`}
                        >
                          {positive ? '+' : ''}
                          {impact.toFixed(1)}%
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 rounded-full bg-slate-800/70">
                        <div
                          className="pf-bar h-full"
                          style={{
                            width: `${magnitude}%`,
                            backgroundColor: positive ? '#34d399' : '#f87171',
                            animationDelay: `${180 + i * 70}ms`,
                            boxShadow: `0 0 8px ${positive ? '#34d39966' : '#f8717166'}`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-[11px] text-slate-500">
                        Portfolio lands near{' '}
                        <span className="font-semibold text-slate-300">
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
