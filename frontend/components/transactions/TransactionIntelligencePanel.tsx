'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  BrainCircuit,
  AlertTriangle,
  Repeat,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp
} from 'lucide-react'

export default function TransactionIntelligencePanel() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/transactions/smart/intelligence')
        setData(res.data)
      } catch (error) {
        console.error('Failed to load transaction intelligence', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="card card-pad relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl"
      />

      {/* Header */}
      <div className="relative mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile icon-tile-violet">
            <BrainCircuit className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="card-title">Neural Transaction Intelligence</h3>
              <span className="badge badge-ai">
                <Sparkles className="h-3 w-3" /> AI Engine
              </span>
            </div>
            <p className="card-subtitle">Automated anomaly detection, recurring subscription radar & smart tagging</p>
          </div>
        </div>

        <span className="badge badge-ai self-start sm:self-auto">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
          </span>
          Realtime Observer
        </span>
      </div>

      {loading ? (
        <div className="relative grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          <div className="skeleton h-32" />
          <div className="skeleton hidden h-32 md:block" />
        </div>
      ) : !data ? (
        <div className="relative py-4 text-sm text-slate-400">No AI intelligence data available yet.</div>
      ) : (
        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Smart Categorization */}
          <div className="min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="eyebrow flex items-center gap-1.5 text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                Category Optimization
              </h4>
              <span className="shrink-0 text-[11px] text-slate-500">Confidence rating</span>
            </div>

            {data.suggestions?.length ? (
              <div className="space-y-2">
                {data.suggestions.slice(0, 3).map((item: any) => (
                  <div
                    key={item.transactionId}
                    className="surface-inset flex items-center justify-between gap-3 p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">{item.suggestedCategory}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{item.reason}</p>
                    </div>
                    <span className="badge badge-ai num shrink-0">
                      {item.confidence}% Match
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="surface-inset p-4 text-center text-xs text-slate-400">
                All transactions are cleanly categorized with high fidelity.
              </div>
            )}
          </div>

          {/* Anomaly & Recurring Radar */}
          <div className="min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="eyebrow flex items-center gap-1.5 text-slate-300">
                <Repeat className="h-3.5 w-3.5 text-cyan-300" />
                Anomalies & Recurring Radar
              </h4>
              <span className="shrink-0 text-[11px] text-slate-500">Pattern engine</span>
            </div>

            {data.unusualSpend?.length || data.recurring?.length ? (
              <div className="space-y-2">
                {[...(data.unusualSpend || []).slice(0, 2), ...(data.recurring || []).slice(0, 2)].map((item: any, index: number) => (
                  <div
                    key={index}
                    className="surface-inset flex items-center justify-between gap-3 p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100">{item.reason || item.classification}</p>
                      <p className="num mt-0.5 text-xs text-slate-400">
                        {item.amount ? `Estimated ₹${Math.round(item.amount).toLocaleString('en-IN')}` : 'Identified recurring pattern'}
                      </p>
                    </div>
                    <span className="badge badge-info num shrink-0">
                      {item.confidence}% Confidence
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="surface-inset p-4 text-center text-xs text-slate-400">
                No unusual spending anomalies or new recurring fees detected this cycle.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
