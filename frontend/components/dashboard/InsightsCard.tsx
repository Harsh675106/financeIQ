'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
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
      return 'border-rose-500/30 bg-rose-500/10 text-rose-200 hover:border-rose-500/50'
    case 'warning':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-200 hover:border-amber-500/50'
    case 'info':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-500/50'
    default:
      return 'border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-700'
  }
}

function severityIcon(sev: string) {
  switch (sev) {
    case 'critical':
      return <AlertTriangle className="h-4 w-4 text-rose-400 animate-pulse" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-400" />
    case 'info':
      return <Info className="h-4 w-4 text-emerald-400" />
    default:
      return <CheckCircle2 className="h-4 w-4 text-slate-400" />
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
    <div className="card card-pad card-spotlight group animate-fade-up">
      {/* Header with Filter Pill Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 icon-morph-container">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-50">Smart Insights</h2>
            <p className="text-xs text-slate-400">AI-generated financial intelligence</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex rounded-lg border border-slate-800 bg-slate-950/70 p-0.5 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-md px-2 py-1 font-medium transition-all ${
              filter === 'all'
                ? 'bg-primary-500/20 text-primary-300 ring-1 ring-primary-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('priority')}
            className={`rounded-md px-2 py-1 font-medium transition-all ${
              filter === 'priority'
                ? 'bg-primary-500/20 text-primary-300 ring-1 ring-primary-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Priority
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="py-8 text-center text-slate-400">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/50 mb-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-xs">All caught up! No active recommendations right now.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {filteredInsights.map((ins, idx) => (
            <div
              key={idx}
              className={`group/item flex items-start justify-between gap-3 p-3 rounded-xl border transition-all duration-300 ${severityStyle(
                ins.severity
              )} hover:scale-[1.01]`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">{severityIcon(ins.severity)}</div>
                <div>
                  <p className="text-xs font-medium leading-relaxed">{ins.message}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-80 group-hover/item:opacity-100 transition-opacity">
                <button
                  onClick={() => handleResolve(idx)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800/80 hover:text-emerald-300 transition-colors"
                  title="Mark as reviewed"
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
