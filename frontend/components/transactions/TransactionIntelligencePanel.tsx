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
    <div className="relative overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950/95 p-6 md:p-8 shadow-2xl backdrop-blur-xl stage-card-lift">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-500/10 blur-3xl" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/25 to-teal-500/15 border border-primary-500/40 shadow-lg">
            <BrainCircuit className="h-6 w-6 text-primary-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              Neural Transaction Intelligence
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/15 px-2.5 py-0.5 text-xs font-semibold text-primary-300 border border-primary-500/30">
                <Sparkles className="h-3.5 w-3.5" /> AI Engine
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Automated anomaly detection, recurring subscription radar & smart tagging</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-primary-400 animate-ping" />
          <span className="text-xs font-mono text-primary-300 font-bold">Realtime Observer</span>
        </div>
      </div>

      {loading ? (
        <div className="h-32 bg-slate-800/40 rounded-2xl animate-pulse border border-slate-800" />
      ) : !data ? (
        <div className="text-xs text-slate-400 py-4">No AI intelligence data available yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Smart Categorization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary-400" />
                Category Optimization
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">Confidence rating</span>
            </div>

            {data.suggestions?.length ? (
              <div className="space-y-2.5">
                {data.suggestions.slice(0, 3).map((item: any) => (
                  <div
                    key={item.transactionId}
                    className="flex items-center justify-between rounded-2xl border border-slate-800/90 bg-slate-900/60 p-3.5 hover:border-slate-700 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-100">{item.suggestedCategory}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.reason}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-primary-300 bg-primary-500/15 px-2.5 py-1 rounded-xl border border-primary-500/30">
                      {item.confidence}% Match
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 text-xs text-slate-400 text-center">
                All transactions are cleanly categorized with high fidelity.
              </div>
            )}
          </div>

          {/* Anomaly & Recurring Radar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5 text-cyan-400" />
                Anomalies & Recurring Radar
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">Pattern engine</span>
            </div>

            {data.unusualSpend?.length || data.recurring?.length ? (
              <div className="space-y-2.5">
                {[...(data.unusualSpend || []).slice(0, 2), ...(data.recurring || []).slice(0, 2)].map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-2xl border border-slate-800/90 bg-slate-900/60 p-3.5 hover:border-slate-700 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-100">{item.reason || item.classification}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.amount ? `Estimated ₹${Math.round(item.amount).toLocaleString('en-IN')}` : 'Identified recurring pattern'}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-500/15 px-2.5 py-1 rounded-xl border border-cyan-500/30">
                      {item.confidence}% Confidence
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 text-xs text-slate-400 text-center">
                No unusual spending anomalies or new recurring fees detected this cycle.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
