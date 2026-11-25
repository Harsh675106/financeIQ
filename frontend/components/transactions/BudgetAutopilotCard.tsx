'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { ShieldCheck } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'

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
      <SectionHeader as="h3" icon={ShieldCheck} tone="violet" title="AI Budget Autopilot" className="mb-5" />

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-24" />
          <div className="skeleton h-14" />
        </div>
      ) : !data ? (
        <div className="text-sm text-slate-400">No autopilot data available.</div>
      ) : (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-primary-400/20 bg-gradient-to-br from-primary-500/[0.16] via-violet-500/[0.08] to-cyan-500/[0.05] p-4">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-primary-500/25 blur-2xl"
            />
            <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-200">Weekly safe to spend</p>
            <p className="kpi-value relative mt-2 break-words text-2xl sm:text-3xl">
              {Math.round(data.weeklySafeToSpend).toLocaleString('en-IN')}
            </p>
            <p className="num relative mt-2 text-xs text-slate-300">Confidence {data.confidence}%</p>
          </div>

          <div className="space-y-2">
            {(data.recommendations || []).slice(0, 4).map((item: any) => (
              <div key={item.category} className="surface-inset p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 truncate text-sm font-medium text-slate-100">{item.category}</div>
                  <div className="num shrink-0 text-xs text-slate-400">
                    Target {Math.round(item.autopilotBudget).toLocaleString('en-IN')}
                  </div>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{item.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
