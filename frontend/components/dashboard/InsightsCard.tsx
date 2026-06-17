'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Lightbulb, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'

interface Insight {
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
      return 'border-red-500/20 bg-red-500/10 text-red-200'
    case 'warning':
      return 'border-yellow-500/20 bg-yellow-500/10 text-yellow-200'
    case 'info':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
    default:
      return 'border-slate-700/70 bg-slate-900/50 text-slate-200'
  }
}

function severityIcon(sev: string) {
  switch (sev) {
    case 'critical':
      return <AlertTriangle className="h-4 w-4 text-danger-300" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-300" />
    case 'info':
      return <Info className="h-4 w-4 text-primary-300" />
    default:
      return <CheckCircle2 className="h-4 w-4 text-slate-300" />
  }
}

export default function InsightsCard() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="card card-pad card-hover">
      <div className="flex items-center space-x-2 mb-4">
        <Lightbulb className="h-6 w-6 text-primary-300" />
        <h2 className="text-lg font-semibold text-slate-50">Insights</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-800/60 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="text-sm text-slate-400">No insights at the moment. Keep transacting to generate insights.</div>
      ) : (
        <div className="space-y-3">
          {insights.map((ins, idx) => (
            <div key={idx} className={`flex items-start space-x-2 p-3 rounded-lg border ${severityStyle(ins.severity)}`}>
              <div className="mt-0.5">{severityIcon(ins.severity)}</div>
              <div className="text-sm">{ins.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
