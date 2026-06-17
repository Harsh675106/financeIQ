'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Calendar, CheckCircle2, AlertTriangle, Target } from 'lucide-react'

interface GoalProjectionItem {
  goal: {
    id: number
    name: string
    target_amount: number
    current_amount: number
    monthly_contribution: number
    target_date: string | null
  }
  projection: {
    feasible: boolean
    monthsToGoal: number | null
    completionDate: string | null
    requiredMonthly: number | null
    projectedValueAtTargetDate: number
    projectedShortfall: number
    successProbability: number
    recommendation: string
  }
}

interface GoalProjectionsProps {
  refreshKey?: number
}

export default function GoalProjections({ refreshKey = 0 }: GoalProjectionsProps) {
  const [items, setItems] = useState<GoalProjectionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/goals/projections/all')
        setItems(res.data.projections || [])
      } catch (error) {
        console.error('Failed to load projections', error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [refreshKey])

  return (
    <div className="card card-pad card-hover">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary-300" />
        <h3 className="text-lg font-semibold text-slate-50">Goal Probability Engine</h3>
      </div>

      {loading ? (
        <div className="h-24 bg-slate-800/60 rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-sm text-slate-400">No active goals.</div>
          ) : (
            items.map((item) => (
              <div key={item.goal.id} className="p-4 rounded-xl border border-slate-800/70 bg-slate-900/40">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-slate-100">{item.goal.name}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Success probability {item.projection.successProbability}%
                    </div>
                  </div>
                  <div className="w-28">
                    <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          item.projection.successProbability >= 75
                            ? 'bg-emerald-400'
                            : item.projection.successProbability >= 45
                              ? 'bg-yellow-400'
                              : 'bg-rose-400'
                        }`}
                        style={{ width: `${item.projection.successProbability}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-300 space-y-2">
                  {item.projection.feasible && item.projection.monthsToGoal !== null ? (
                    <div className="flex items-center gap-1 text-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      Completion in about {item.projection.monthsToGoal} months by {item.projection.completionDate}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-200">
                      <AlertTriangle className="h-4 w-4" />
                      Shortfall at target date: {Math.round(item.projection.projectedShortfall).toLocaleString('en-IN')}
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-slate-300">
                    <Target className="h-4 w-4 text-primary-300" />
                    Projected value by target date: {Math.round(item.projection.projectedValueAtTargetDate).toLocaleString('en-IN')}
                  </div>

                  {item.projection.requiredMonthly !== null ? (
                    <div className="text-slate-400">
                      Required monthly contribution: {Math.round(item.projection.requiredMonthly).toLocaleString('en-IN')}
                    </div>
                  ) : null}

                  <div className="text-slate-300">{item.projection.recommendation}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
