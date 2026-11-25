'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { AlertTriangle, ArrowRight, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react'
import Link from 'next/link'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'

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
  if (sev === 'critical') return 'border-rose-500/25 bg-rose-500/[0.07] text-rose-200 hover:border-rose-400/45'
  if (sev === 'high') return 'border-orange-500/25 bg-orange-500/[0.07] text-orange-200 hover:border-orange-400/45'
  if (sev === 'warning') return 'border-amber-500/25 bg-amber-500/[0.07] text-amber-200 hover:border-amber-400/45'
  return 'border-sky-500/20 bg-sky-500/[0.06] text-sky-200 hover:border-sky-400/40'
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
    <div className="card card-pad card-spotlight group h-full animate-fade-up">
      {/* Header */}
      <SectionHeader
        icon={ShieldAlert}
        tone="amber"
        title="Recommended Actions"
        subtitle="High-priority risk mitigations"
        className="relative mb-5"
        actions={
          <Link href="/dashboard/alerts" className="btn-soft btn-sm">
            View All
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        }
      />

      {loading ? (
        <div className="relative space-y-2.5" aria-busy="true">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-14" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon={CheckCircle}
          tone="emerald"
          title="No critical risk warnings detected!"
          className="relative"
        />
      ) : (
        <div className="scroll-thin relative max-h-64 space-y-2.5 overflow-y-auto pr-1">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-3 transition-colors duration-200 ${sevStyle(item.severity)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-xs font-semibold text-slate-100">{item.title || item.message}</p>
                  <p className="mt-1 break-words text-[11px] leading-snug opacity-90">{item.message}</p>
                  {item.recommendation && (
                    <div className="mt-2 flex items-start gap-1.5 text-[11px] font-medium text-violet-200">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-violet-300" aria-hidden="true" />
                      <span className="min-w-0 break-words">{item.recommendation}</span>
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  {item.confidence && (
                    <span className="badge badge-neutral num px-2 text-[10px] leading-4">
                      {Math.round(item.confidence)}% conf.
                    </span>
                  )}
                  {item.estimatedMonthlyImpact && (
                    <div className="num text-[10px] font-bold text-emerald-400">
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
