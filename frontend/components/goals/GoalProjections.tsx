'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Calendar, CheckCircle2, AlertTriangle, Target, TrendingUp, Clock, Sparkles, BrainCircuit } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'

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
    <div className="card card-pad relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl"
      />

      <SectionHeader
        icon={BrainCircuit}
        tone="violet"
        as="h3"
        title="Goal Probability & Trajectory Matrix"
        className="relative mb-5 border-b border-white/[0.06] pb-4"
        actions={
          <span className="badge badge-ai">
            <Sparkles className="h-3 w-3" />
            AI Forecast Engine
          </span>
        }
      />

      {loading ? (
        <div className="relative space-y-3" role="status" aria-label="Loading projections">
          <div className="skeleton h-28 rounded-2xl" />
          <div className="skeleton h-28 rounded-2xl opacity-60" />
        </div>
      ) : (
        <div className="relative space-y-4">
          {items.length === 0 ? (
            <EmptyState compact icon={Target} tone="slate" title="No active goal projections found." />
          ) : (
            items.map((item) => {
              const isCompleted = item.projection.completionPercentage >= 100
              const isOverdue = item.projection.daysRemaining !== null && item.projection.daysRemaining < 0
              const isOnTrack = item.projection.successProbability >= 75

              return (
                <div
                  key={item.goal.id}
                  className={`surface-inset relative overflow-hidden p-4 transition-colors sm:p-5 ${
                    isCompleted
                      ? 'border-emerald-400/25 bg-emerald-500/[0.04]'
                      : isOverdue
                      ? 'border-rose-400/25 bg-rose-500/[0.05]'
                      : isOnTrack
                      ? 'border-emerald-400/20'
                      : 'border-amber-400/20'
                  }`}
                >
                  {/* Status accent rail */}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-4 left-0 w-[3px] rounded-r-full ${
                      isCompleted
                        ? 'bg-emerald-400/80'
                        : isOverdue
                        ? 'bg-rose-400/80'
                        : isOnTrack
                        ? 'bg-emerald-400/60'
                        : 'bg-amber-400/70'
                    }`}
                  />

                  {/* Header */}
                  <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 break-words font-display text-[15px] font-semibold tracking-tight text-white sm:text-base">
                        {item.goal.name}
                        {isCompleted && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
                        {isOverdue && <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />}
                      </div>
                      <div className="num mt-0.5 text-xs text-slate-400">
                        {item.projection.completionPercentage.toFixed(1)}% complete • Success probability{' '}
                        <strong className={`font-semibold ${isOnTrack ? 'text-emerald-300' : 'text-amber-300'}`}>
                          {item.projection.successProbability}%
                        </strong>
                      </div>
                    </div>

                    <span className={`badge self-start sm:self-auto ${
                      isCompleted
                        ? 'badge-success'
                        : isOverdue
                        ? 'badge-danger'
                        : isOnTrack
                        ? 'badge-success'
                        : 'badge-warning'
                    }`}>
                      {isCompleted ? 'Goal Conquered' : isOverdue ? 'Overdue Action Needed' : isOnTrack ? 'High Velocity' : 'Pacing Low'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="num mb-1.5 flex justify-between text-xs text-slate-400">
                      <span>₹{item.goal.current_amount.toLocaleString('en-IN')}</span>
                      <span>₹{item.goal.target_amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="progress-track h-2">
                      <div
                        className={`progress-fill neon-progress-bar ${
                          isCompleted
                            ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 shadow-[0_0_12px_-2px_rgba(52,211,153,0.75)]'
                            : isOnTrack
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_12px_-2px_rgba(52,211,153,0.6)]'
                            : 'bg-gradient-to-r from-amber-400 to-orange-400 shadow-[0_0_12px_-2px_rgba(251,191,36,0.6)]'
                        }`}
                        style={{ width: `${Math.min(100, item.projection.completionPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5">
                      <div className="text-[10px] text-slate-400">Projected Value</div>
                      <div className="num mt-0.5 break-words text-sm font-semibold text-slate-100">
                        ₹{item.projection.projectedValueAtTargetDate.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {item.projection.projectedShortfall > 0 ? (
                      <div className="min-w-0 rounded-xl border border-rose-400/20 bg-rose-500/[0.08] p-2.5">
                        <div className="text-[10px] text-rose-300">Projected Gap</div>
                        <div className="num mt-0.5 break-words text-sm font-semibold text-rose-200">
                          ₹{item.projection.projectedShortfall.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ) : (
                      <div className="min-w-0 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] p-2.5">
                        <div className="text-[10px] text-emerald-300">Surplus Outlook</div>
                        <div className="mt-0.5 text-sm font-semibold text-emerald-200">
                          On Schedule
                        </div>
                      </div>
                    )}

                    <div className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="h-3 w-3 text-slate-400" />
                        Time to Target
                      </div>
                      <div className="num mt-0.5 break-words text-sm font-semibold text-slate-100">
                        {formatMonths(item.projection.monthsRemaining)}
                      </div>
                    </div>

                    <div className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5">
                      <div className="text-[10px] text-slate-400">Required Pace</div>
                      <div className="num mt-0.5 break-words text-sm font-semibold text-slate-100">
                        {item.projection.requiredMonthly > 0
                          ? `₹${item.projection.requiredMonthly.toLocaleString('en-IN')}/mo`
                          : 'Target Met'}
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Narrative */}
                  {item.projection.recommendation && (
                    <div className="flex items-start gap-2 rounded-xl border border-violet-400/15 bg-violet-500/[0.06] p-3 text-xs leading-relaxed text-slate-300">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
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
