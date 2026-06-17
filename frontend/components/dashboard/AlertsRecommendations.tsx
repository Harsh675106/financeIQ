'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { AlertTriangle, Info } from 'lucide-react'

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
  if (sev === 'critical') return 'border-red-500/20 bg-red-500/10 text-red-200'
  if (sev === 'high') return 'border-orange-500/20 bg-orange-500/10 text-orange-200'
  if (sev === 'warning') return 'border-yellow-500/20 bg-yellow-500/10 text-yellow-200'
  return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
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
    <div className="card card-pad card-hover">
      <div className="flex items-center space-x-2 mb-4">
        <AlertTriangle className="h-6 w-6 text-primary-300" />
        <h2 className="text-lg font-semibold text-slate-50">Recommended Actions</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-400">No recommendations right now.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className={`p-3 rounded-lg border ${sevStyle(item.severity)}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{item.title || item.message}</div>
                  <div className="mt-1 text-sm opacity-90">{item.message}</div>
                  {item.recommendation ? (
                    <div className="mt-2 text-xs opacity-80">{item.recommendation}</div>
                  ) : null}
                </div>
                <div className="text-right text-[11px] opacity-80">
                  {item.confidence ? <div>{Math.round(item.confidence)}% conf.</div> : null}
                  {item.estimatedMonthlyImpact ? (
                    <div>{Math.round(item.estimatedMonthlyImpact).toLocaleString('en-IN')}/mo</div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
