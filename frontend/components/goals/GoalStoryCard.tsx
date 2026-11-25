'use client'

import React from 'react'
import {
  Target,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Calendar,
  Zap,
  TrendingUp,
  Sparkles,
  Home,
  Car,
  Plane,
  Shield,
  GraduationCap,
  Gem,
  Smartphone,
  Clock,
  Flame,
  AlertTriangle,
} from 'lucide-react'

interface Goal {
  id: number
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  monthly_contribution: number
  status: 'active' | 'completed' | 'paused'
}

interface GoalStoryCardProps {
  goal: Goal
  isSelected?: boolean
  onSelect?: () => void
  onContribute: (goal: Goal) => void
  onQuickContribute: (goal: Goal, amount: number) => void
  onEdit: (goal: Goal) => void
  onDelete: (id: number) => void
  onOpenSimulator: (goal: Goal) => void
}

function getCategoryTheme(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('house') || lower.includes('home') || lower.includes('flat') || lower.includes('mortgage') || lower.includes('property')) {
    return { icon: Home, color: 'text-primary-600', bg: 'bg-primary-50 border-primary-200', glow: 'rgba(16,185,129,0.22)' }
  }
  if (lower.includes('car') || lower.includes('bike') || lower.includes('vehicle') || lower.includes('auto')) {
    return { icon: Car, color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200', glow: 'rgba(34,211,238,0.22)' }
  }
  if (lower.includes('travel') || lower.includes('trip') || lower.includes('vacation') || lower.includes('holiday') || lower.includes('flight')) {
    return { icon: Plane, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200', glow: 'rgba(56,189,248,0.22)' }
  }
  if (lower.includes('emergency') || lower.includes('safe') || lower.includes('shield') || lower.includes('reserve')) {
    return { icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', glow: 'rgba(245,158,11,0.2)' }
  }
  if (lower.includes('study') || lower.includes('degree') || lower.includes('college') || lower.includes('school') || lower.includes('course')) {
    return { icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', glow: 'rgba(99,102,241,0.2)' }
  }
  if (lower.includes('phone') || lower.includes('laptop') || lower.includes('mac') || lower.includes('tech') || lower.includes('gadget')) {
    return { icon: Smartphone, color: 'text-pink-600', bg: 'bg-pink-50 border-pink-200', glow: 'rgba(236,72,153,0.18)' }
  }
  return { icon: Gem, color: 'text-teal-600', bg: 'bg-gradient-to-br from-primary-50 to-ice-50 border-primary-200', glow: 'rgba(56,189,248,0.22)' }
}

function getStoryChapterName(progress: number) {
  if (progress >= 100) return { title: 'Zenith Mastered', chapter: 'Chapter V', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  if (progress >= 75) return { title: 'Summit Horizon', chapter: 'Chapter IV', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' }
  if (progress >= 50) return { title: 'The Orbit', chapter: 'Chapter III', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  if (progress >= 25) return { title: 'The Ascent', chapter: 'Chapter II', badge: 'bg-teal-50 text-teal-700 border-teal-200' }
  return { title: 'The Spark', chapter: 'Chapter I', badge: 'bg-sky-50 text-sky-700 border-sky-200' }
}

export default function GoalStoryCard({
  goal,
  isSelected,
  onSelect,
  onContribute,
  onQuickContribute,
  onEdit,
  onDelete,
  onOpenSimulator,
}: GoalStoryCardProps) {
  const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100)
  const remaining = Math.max(0, goal.target_amount - goal.current_amount)
  const isCompleted = progress >= 100

  const getDaysRemaining = (date: string | null) => {
    if (!date) return null
    const diff = new Date(date).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const daysRemaining = getDaysRemaining(goal.target_date)
  const isOverdue = daysRemaining !== null && daysRemaining < 0
  const isDueSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 30

  const theme = getCategoryTheme(goal.name)
  const CategoryIcon = theme.icon
  const chapter = getStoryChapterName(progress)

  return (
    <div
      onClick={onSelect}
      className={`card card-hover group relative flex cursor-pointer flex-col justify-between overflow-hidden p-5 motion-safe:hover:-translate-y-1 sm:p-6 ${
        isSelected
          ? 'border-primary-300 shadow-[0_0_0_3px_rgba(16,185,129,0.12),0_16px_36px_-18px_rgba(5,150,105,0.35)]'
          : isCompleted
          ? 'border-emerald-200'
          : ''
      }`}
    >
      {/* Ambient category wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-60 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: theme.glow }}
      />
      {isSelected && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-0.5 rounded-b-full bg-gradient-to-r from-primary-400 to-ice-400"
        />
      )}

      {/* Top Banner: Category + Chapter Badge */}
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${theme.bg} ${theme.color} transition-transform duration-300 motion-safe:group-hover:scale-105`}
              style={{ boxShadow: `inset 0 1px 0 0 #ffffff, 0 10px 22px -12px ${theme.glow}` }}
            >
              <CategoryIcon className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase leading-4 tracking-wider ${chapter.badge}`}>
                  <Sparkles className="h-2.5 w-2.5 shrink-0" />
                  {chapter.chapter} • {chapter.title}
                </span>
              </div>
              <h3 className="mt-1.5 break-words font-display text-base font-semibold leading-snug tracking-tight text-ink-900 transition-colors group-hover:text-primary-700 sm:text-lg">
                {goal.name}
              </h3>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className={`num inline-block font-display text-lg font-semibold leading-none ${
              isCompleted ? 'text-emerald-600' : 'text-gradient'
            }`}>
              {progress.toFixed(0)}%
            </div>
            <span className="mt-1 block text-[10px] text-slate-500">Achieved</span>
          </div>
        </div>

        {/* Currency Metrics */}
        <div className="mt-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs text-slate-500">Current Capital</span>
            <div className="kpi-value mt-0.5 break-words text-xl">
              ₹{Number(goal.current_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="min-w-0 text-right">
            <span className="text-xs text-slate-500">Target Summit</span>
            <div className="num mt-0.5 break-words text-base font-semibold text-ink-700">
              ₹{Number(goal.target_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Storyline Glowing Progress Bar with Checkpoints */}
        <div className="relative mt-3">
          <div className="progress-track h-2.5">
            <div
              className={`progress-fill neon-progress-bar ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                  : isOverdue
                  ? 'bg-gradient-to-r from-rose-400 to-rose-600'
                  : ''
              }`}
              style={{ width: `${Math.max(2, progress)}%` }}
            />
            <span aria-hidden="true" className="absolute inset-y-0 left-1/4 w-px bg-white/90" />
            <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-white/90" />
            <span aria-hidden="true" className="absolute inset-y-0 left-3/4 w-px bg-white/90" />
          </div>

          {/* Micro Milestone Markers */}
          <div className="num mt-1.5 flex justify-between text-[9px] text-slate-500">
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Story Telemetry Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="surface-inset min-w-0 p-2.5">
            <span className="block text-[10px] text-slate-500">Monthly Fuel</span>
            <span className="num mt-0.5 block truncate font-semibold text-ink-900">
              {Number(goal.monthly_contribution || 0) > 0
                ? `₹${Number(goal.monthly_contribution).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo`
                : 'Not Set'}
            </span>
          </div>

          <div className={`min-w-0 rounded-[0.875rem] border p-2.5 ${
            isOverdue
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : isDueSoon
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : 'border-line bg-canvas text-ink-900'
          }`}>
            <span className="block text-[10px] text-slate-500">Summit Target</span>
            <span className="num mt-0.5 block truncate font-semibold">
              {daysRemaining !== null
                ? isOverdue
                  ? `${Math.abs(daysRemaining)}d Overdue`
                  : daysRemaining === 0
                  ? 'Due Today'
                  : `${daysRemaining}d Left`
                : 'No Target Date'}
            </span>
          </div>
        </div>

        {/* Frictionless Quick Contribute Chips */}
        {!isCompleted && (
          <div className="mt-4 border-t border-line pt-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <Zap className="h-3 w-3 text-primary-600" />
                Quick Fuel Boost:
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenSimulator(goal)
                }}
                className="-mr-1.5 flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-ice-700 transition-colors hover:bg-ice-50 hover:text-ice-800"
              >
                Simulate <TrendingUp className="h-3 w-3" />
              </button>
            </div>

            <div className="flex gap-1.5">
              {[500, 1000, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onQuickContribute(goal, amt)
                  }}
                  className="num flex-1 rounded-lg border border-line-strong bg-white py-2 text-center text-xs font-semibold text-ink-700 shadow-xs transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                >
                  +₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Action Controls */}
      <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-line pt-3.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onContribute(goal)
          }}
          className="btn-soft btn-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Custom Funds
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(goal)
            }}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-ink-900/[0.05] hover:text-ink-900"
            title="Edit Goal"
            aria-label="Edit Goal"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(goal.id)
            }}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
            title="Delete Goal"
            aria-label="Delete Goal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
