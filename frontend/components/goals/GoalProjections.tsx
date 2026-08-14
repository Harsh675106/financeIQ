'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Calendar, CheckCircle2, AlertTriangle, Target, TrendingUp, Clock } from 'lucide-react'

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
    completionPercentage: number
    daysRemaining: number | null
    monthsRemaining: number | null
    feasible: boolean
    monthsToGoal: number | null
    completionDate: string | null
    requiredMonthly: number
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

  const formatDays = (days: number | null) => {
    if (days === null) return 'No deadline'
    if (days < 0) return `${Math.abs(days)} days overdue`
    if (days === 0) return 'Due today'
    return `${days} days remaining`
  }

  const formatMonths = (months: number | null) => {
    if (months === null) return 'N/A'
    if (months < 0) return `${Math.abs(months)} months overdue`
    if (months === 0) return 'This month'
    return `${months} months`
  }

  return (
    <div className="card card-pad card-hover">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary-300" />
        <h3 className="text-lg font-semibold text-slate-50">Goal Probability Engine</h3>
      </div>

      {loading ? (
        <div className="h-24 bg-slate-800/60 rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-sm text-slate-400">No active goals.</div>
          ) : (
            items.map((item) => {
              const isCompleted = item.projection.completionPercentage >= 100
              const isOverdue = item.projection.daysRemaining !== null && item.projection.daysRemaining < 0
              const isOnTrack = item.projection.successProbability >= 75

              return (
                <div
                  key={item.goal.id}
                  className={`p-4 rounded-xl border ${
                    isCompleted
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : isOverdue
                        ? 'border-rose-500/30 bg-rose-500/10'
                        : isOnTrack
                          ? 'border-primary-500/30 bg-primary-500/10'
                          : 'border-yellow-500/30 bg-yellow-500/10'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                        {item.goal.name}
                        {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                        {isOverdue && <AlertTriangle className="h-4 w-4 text-rose-400" />}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {item.projection.completionPercentage.toFixed(1)}% complete • Success probability {item.projection.successProbability}%
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>₹{(item.goal.current_amount).toLocaleString('en-IN')}</span>
                      <span>₹{(item.goal.target_amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isCompleted
                            ? 'bg-emerald-400'
                            : item.projection.successProbability >= 75
                              ? 'bg-primary-400'
                              : item.projection.successProbability >= 45
                                ? 'bg-yellow-400'
                                : 'bg-rose-400'
                        }`}
                        style={{ width: `${Math.min(100, item.projection.completionPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                    <div className="rounded bg-slate-900/40 p-2 border border-slate-800/50">
                      <div className="text-slate-400">Projected Value</div>
                      <div className="text-sm font-semibold text-slate-100 mt-1">
                        ₹{(item.projection.projectedValueAtTargetDate).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {item.projection.projectedShortfall > 0 && (
                      <div className="rounded bg-rose-900/30 p-2 border border-rose-800/50">
                        <div className="text-rose-300">Shortfall</div>
                        <div className="text-sm font-semibold text-rose-200 mt-1">
                          ₹{(item.projection.projectedShortfall).toLocaleString('en-IN')}
                        </div>
                      </div>
                    )}

                    {item.projection.monthsRemaining !== null && (
                      <div className="rounded bg-slate-900/40 p-2 border border-slate-800/50">
                        <div className="text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Time to Deadline
                        </div>
                        <div className="text-sm font-semibold text-slate-100 mt-1">
                          {formatMonths(item.projection.monthsRemaining)}
                        </div>
                      </div>
                    )}

                    {item.projection.requiredMonthly > 0 && (
                      <div className="rounded bg-slate-900/40 p-2 border border-slate-800/50">
                        <div className="text-slate-400">Required Monthly</div>
                        <div className="text-sm font-semibold text-slate-100 mt-1">
                          ₹{(item.projection.requiredMonthly).toLocaleString('en-IN')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Key Info */}
                  <div className="text-xs text-slate-300 space-y-1 p-3 rounded bg-slate-900/40 border border-slate-800/50">
                    {item.projection.monthsToGoal !== null && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-primary-300" />
                        <span>
                          Will reach goal in {item.projection.monthsToGoal} months
                          {item.projection.completionDate && ` (${item.projection.completionDate})`}
                        </span>
                      </div>
                    )}

                    {item.projection.daysRemaining !== null && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-primary-300" />
                        <span>{formatDays(item.projection.daysRemaining)}</span>
                      </div>
                    )}

                    <div className="text-slate-400 mt-2 pt-2 border-t border-slate-700">
                      {item.projection.recommendation}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
