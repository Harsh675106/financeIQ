'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'
import {
  Lightbulb,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react'

interface Insight {
  id?: string | number
  type: string
  severity: 'info' | 'warning' | 'critical' | string
  message: string
}

interface DashboardResponse {
  insights: Insight[]
}

function severityStyle(sev: string) {
  switch (sev) {
    case 'critical':
      return 'border-rose-500/25 bg-rose-500/[0.07] text-rose-100 hover:border-rose-400/45'
    case 'warning':
      return 'border-amber-500/25 bg-amber-500/[0.07] text-amber-100 hover:border-amber-400/45'
    case 'info':
      return 'border-cyan-500/20 bg-cyan-500/[0.06] text-cyan-50 hover:border-cyan-400/40'
    default:
      return 'border-white/[0.06] bg-white/[0.025] text-slate-200 hover:border-white/[0.12]'
  }
}

function severityIcon(sev: string) {
  switch (sev) {
    case 'critical':
      return (
        <span className="icon-tile icon-tile-sm icon-tile-rose h-7 w-7">
          <AlertTriangle className="h-3.5 w-3.5" />
        </span>
      )
    case 'warning':
      return (
        <span className="icon-tile icon-tile-sm icon-tile-amber h-7 w-7">
          <AlertTriangle className="h-3.5 w-3.5" />
        </span>
      )
    case 'info':
      return (
        <span className="icon-tile icon-tile-sm icon-tile-cyan h-7 w-7">
          <Info className="h-3.5 w-3.5" />
        </span>
      )
    default:
      return (
        <span className="icon-tile icon-tile-sm icon-tile-slate h-7 w-7">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </span>
      )
  }
}

export default function InsightsCard() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'priority'>('all')
  const [resolvedIds, setResolvedIds] = useState<Record<string, boolean>>({})
  const router = useRouter()

  const fetchData = async () => {
    try {
      const res = await api.get<DashboardResponse>('/analytics/dashboard')
      setInsights(res.data.insights || [])
    } catch (e) {
      console.error('Failed to fetch insights', e)
      setInsights([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 60000)
    return () => clearInterval(id)
  }, [])

  const handleResolve = (idx: number) => {
    setResolvedIds((prev) => ({ ...prev, [idx]: true }))
  }

  const filteredInsights = insights.filter((ins, idx) => {
    if (resolvedIds[idx]) return false
    if (filter === 'priority') return ins.severity === 'critical' || ins.severity === 'warning'
    return true
  })

  return (
    <div className="card card-pad card-spotlight group h-full animate-fade-up">
      {/* Header with Filter Pill Tabs */}
      <SectionHeader
        icon={Lightbulb}
        tone="violet"
        title="Smart Insights"
        subtitle="AI-generated financial intelligence"
        className="relative mb-5"
        actions={
          <div className="segmented" role="group" aria-label="Filter insights">
            <button
              onClick={() => setFilter('all')}
              aria-pressed={filter === 'all'}
              className={`segmented-item ${filter === 'all' ? 'segmented-item-active' : ''}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('priority')}
              aria-pressed={filter === 'priority'}
              className={`segmented-item ${filter === 'priority' ? 'segmented-item-active' : ''}`}
            >
              Priority
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="relative space-y-2.5" aria-busy="true">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-14"></div>
          ))}
        </div>
      ) : filteredInsights.length === 0 ? (
        <EmptyState
          compact
          icon={Sparkles}
          tone="emerald"
          title="All caught up!"
          description="No active recommendations right now."
          className="relative"
        />
      ) : (
        <div className="scroll-thin relative max-h-64 space-y-2.5 overflow-y-auto pr-1">
          {filteredInsights.map((ins, idx) => (
            <div
              key={idx}
              className={`group/item flex items-start justify-between gap-3 rounded-xl border p-3 transition-colors duration-200 ${severityStyle(
                ins.severity
              )}`}
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <div className="shrink-0">{severityIcon(ins.severity)}</div>
                <div className="min-w-0 pt-1">
                  <p className="break-words text-xs font-medium leading-relaxed">{ins.message}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex shrink-0 items-center gap-1 opacity-80 transition-opacity group-hover/item:opacity-100">
                <button
                  onClick={() => handleResolve(idx)}
                  className="btn-icon h-8 w-8 hover:!text-emerald-300"
                  title="Mark as reviewed"
                  aria-label="Mark as reviewed"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
