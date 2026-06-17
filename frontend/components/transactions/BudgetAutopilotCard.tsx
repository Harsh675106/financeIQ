'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { ShieldCheck } from 'lucide-react'

export default function BudgetAutopilotCard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/budget/autopilot')
        setData(res.data)
      } catch (error) {
        console.error('Failed to load budget autopilot', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="card card-pad card-hover">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="h-5 w-5 text-primary-300" />
        <h3 className="text-lg font-semibold text-slate-50">AI Budget Autopilot</h3>
      </div>

      {loading ? (
        <div className="h-24 bg-slate-800/60 rounded-xl animate-pulse" />
      ) : !data ? (
        <div className="text-sm text-slate-400">No autopilot data available.</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary-500/20 bg-primary-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-primary-200">Weekly safe to spend</p>
            <p className="text-2xl font-semibold text-slate-50 mt-2">
              {Math.round(data.weeklySafeToSpend).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-300 mt-2">Confidence {data.confidence}%</p>
          </div>

          <div className="space-y-3">
            {(data.recommendations || []).slice(0, 4).map((item: any) => (
              <div key={item.category} className="p-3 rounded-xl border border-slate-800/70 bg-slate-900/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-slate-100">{item.category}</div>
                  <div className="text-xs text-slate-400">
                    Target {Math.round(item.autopilotBudget).toLocaleString('en-IN')}
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-2">{item.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
