'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { AlertTriangle, ArrowRight, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface Recommendation {
  alert_type: string
  severity: string
  title?: string
  message: string
  recommendation?: string
  confidence?: number
  estimatedMonthlyImpact?: number
}

function sevStyle(sev: string) {
  if (sev === 'critical') return 'border-rose-500/30 bg-rose-500/10 text-rose-200 hover:border-rose-500/50'
  if (sev === 'high') return 'border-orange-500/30 bg-orange-500/10 text-orange-200 hover:border-orange-500/50'
  if (sev === 'warning') return 'border-amber-500/30 bg-amber-500/10 text-amber-200 hover:border-amber-500/50'
  return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-500/50'
}

export default function AlertsRecommendations() {
  const [items, setItems] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res = await api.get('/alerts/recommendations')
      setItems(res.data.recommendations || [])
    } catch (e) {
      console.error('Failed to load recommendations', e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="card card-pad card-spotlight group animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 icon-morph-container">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-50">Recommended Actions</h2>
            <p className="text-xs text-slate-400">High-priority risk mitigations</p>
          </div>
        </div>

        <Link
          href="/dashboard/alerts"
          className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
        >
          View All
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-slate-400">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/50 mb-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-xs font-medium">No critical risk warnings detected!</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all duration-300 ${sevStyle(
                item.severity
              )} hover:scale-[1.01]`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-100">{item.title || item.message}</p>
                  <p className="mt-1 text-[11px] opacity-90 leading-tight">{item.message}</p>
                  {item.recommendation && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-emerald-300">
                      <Sparkles className="h-3 w-3" />
                      <span>{item.recommendation}</span>
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="text-right shrink-0 space-y-1">
                  {item.confidence && (
                    <span className="inline-block rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      {Math.round(item.confidence)}% conf.
                    </span>
                  )}
                  {item.estimatedMonthlyImpact && (
                    <div className="text-[10px] font-bold text-emerald-400">
                      +₹{Math.round(item.estimatedMonthlyImpact).toLocaleString('en-IN')}/mo
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
