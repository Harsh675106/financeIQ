'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Calendar, CheckCircle2, AlertTriangle, Target, TrendingUp, Clock, Sparkles, BrainCircuit } from 'lucide-react'

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
    <div className="story-glass-card rounded-3xl p-5 sm:p-6 shadow-2xl border border-emerald-500/20">
      <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <BrainCircuit className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              AI Forecast Engine
            </span>
            <h3 className="text-lg font-bold text-slate-100">
              Goal Probability & Trajectory Matrix
            </h3>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-28 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800" />
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-sm text-slate-400 py-3 text-center">No active goal projections found.</div>
          ) : (
            items.map((item) => {
              const isCompleted = item.projection.completionPercentage >= 100
              const isOverdue = item.projection.daysRemaining !== null && item.projection.daysRemaining < 0
              const isOnTrack = item.projection.successProbability >= 75

              return (
                <div
                  key={item.goal.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : isOverdue
                      ? 'border-rose-500/30 bg-rose-500/10'
                      : isOnTrack
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-amber-500/30 bg-amber-500/5'
                  }`}
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <div className="text-base font-bold text-slate-100 flex items-center gap-2">
                        {item.goal.name}
                        {isCompleted && <CheckCircle2 className="h-4 w-4 text-yellow-400" />}
                        {isOverdue && <AlertTriangle className="h-4 w-4 text-rose-400" />}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">
                        {item.projection.completionPercentage.toFixed(1)}% complete • Success probability{' '}
                        <strong className={isOnTrack ? 'text-emerald-300' : 'text-amber-300'}>
                          {item.projection.successProbability}%
                        </strong>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 self-start sm:self-auto rounded-full px-2.5 py-0.5 text-xs font-bold font-mono ${
                      isCompleted
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                        : isOverdue
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : isOnTrack
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {isCompleted ? 'Goal Conquered' : isOverdue ? 'Overdue Action Needed' : isOnTrack ? 'High Velocity' : 'Pacing Low'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3.5">
                    <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>₹{item.goal.current_amount.toLocaleString('en-IN')}</span>
                      <span>₹{item.goal.target_amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-900 border border-slate-800 p-0.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 neon-progress-bar ${
                          isCompleted
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-300'
                            : isOnTrack
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-amber-500 to-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, item.projection.completionPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs">
                    <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Projected Value</div>
                      <div className="text-sm font-bold text-slate-100 mt-0.5">
                        ₹{item.projection.projectedValueAtTargetDate.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {item.projection.projectedShortfall > 0 ? (
                      <div className="rounded-xl bg-rose-950/40 p-2.5 border border-rose-800/60">
                        <div className="text-[10px] text-rose-300">Projected Gap</div>
                        <div className="text-sm font-bold text-rose-200 mt-0.5">
                          ₹{item.projection.projectedShortfall.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-emerald-950/40 p-2.5 border border-emerald-800/60">
                        <div className="text-[10px] text-emerald-300">Surplus Outlook</div>
                        <div className="text-sm font-bold text-emerald-200 mt-0.5">
                          On Schedule
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        Time to Target
                      </div>
                      <div className="text-sm font-bold text-slate-100 mt-0.5">
                        {formatMonths(item.projection.monthsRemaining)}
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Required Pace</div>
                      <div className="text-sm font-bold text-slate-100 mt-0.5">
                        {item.projection.requiredMonthly > 0
                          ? `₹${item.projection.requiredMonthly.toLocaleString('en-IN')}/mo`
                          : 'Target Met'}
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Narrative */}
                  {item.projection.recommendation && (
                    <div className="text-xs text-slate-300 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item.projection.recommendation}</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
