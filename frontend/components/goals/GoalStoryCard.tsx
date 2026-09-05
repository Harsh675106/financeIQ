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
    return { icon: Home, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', glow: 'rgba(244,63,94,0.3)' }
  }
  if (lower.includes('car') || lower.includes('bike') || lower.includes('vehicle') || lower.includes('auto')) {
    return { icon: Car, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', glow: 'rgba(6,182,212,0.3)' }
  }
  if (lower.includes('travel') || lower.includes('trip') || lower.includes('vacation') || lower.includes('holiday') || lower.includes('flight')) {
    return { icon: Plane, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20', glow: 'rgba(56,189,248,0.3)' }
  }
  if (lower.includes('emergency') || lower.includes('safe') || lower.includes('shield') || lower.includes('reserve')) {
    return { icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', glow: 'rgba(245,158,11,0.3)' }
  }
  if (lower.includes('study') || lower.includes('degree') || lower.includes('college') || lower.includes('school') || lower.includes('course')) {
    return { icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', glow: 'rgba(168,85,247,0.3)' }
  }
  if (lower.includes('phone') || lower.includes('laptop') || lower.includes('mac') || lower.includes('tech') || lower.includes('gadget')) {
    return { icon: Smartphone, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', glow: 'rgba(236,72,153,0.3)' }
  }
  return { icon: Gem, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', glow: 'rgba(16,185,129,0.3)' }
}

function getStoryChapterName(progress: number) {
  if (progress >= 100) return { title: 'Zenith Mastered', chapter: 'Chapter V', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' }
  if (progress >= 75) return { title: 'Summit Horizon', chapter: 'Chapter IV', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
  if (progress >= 50) return { title: 'The Orbit', chapter: 'Chapter III', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' }
  if (progress >= 25) return { title: 'The Ascent', chapter: 'Chapter II', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30' }
  return { title: 'The Spark', chapter: 'Chapter I', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
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
      className={`story-glass-card group relative flex flex-col justify-between overflow-hidden rounded-3xl p-5 sm:p-6 transition-all duration-300 cursor-pointer ${
        isSelected
          ? 'ring-2 ring-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
          : isCompleted
          ? 'border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.15)]'
          : 'hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]'
      }`}
    >
      {/* Top Banner: Category + Chapter Badge */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${theme.bg} ${theme.color} shadow-lg transition-transform group-hover:scale-105`}
              style={{ boxShadow: `0 0 15px ${theme.glow}` }}
            >
              <CategoryIcon className="h-6 w-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${chapter.badge}`}>
                  <Sparkles className="h-2.5 w-2.5" />
                  {chapter.chapter} • {chapter.title}
                </span>
              </div>
              <h3 className="mt-1 text-lg font-black text-slate-100 group-hover:text-emerald-300 transition-colors">
                {goal.name}
              </h3>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className={`text-sm font-mono font-black ${
              isCompleted ? 'text-yellow-300' : 'text-emerald-400'
            }`}>
              {progress.toFixed(0)}%
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Achieved</span>
          </div>
        </div>

        {/* Currency Metrics */}
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-slate-400">Current Capital</span>
            <div className="text-xl font-extrabold text-slate-50 tracking-tight">
              ₹{Number(goal.current_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Target Summit</span>
            <div className="text-base font-bold text-slate-300">
              ₹{Number(goal.target_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Storyline Glowing Progress Bar with Checkpoints */}
        <div className="mt-3 relative">
          <div className="h-3 w-full rounded-full bg-slate-900/90 border border-slate-800/80 p-0.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 neon-progress-bar ${
                isCompleted
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-300 shadow-[0_0_15px_#fcd34d]'
                  : isOverdue
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 shadow-[0_0_15px_#f43f5e]'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_15px_rgba(16,185,129,0.7)]'
              }`}
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>

          {/* Micro Milestone Markers */}
          <div className="mt-1.5 flex justify-between text-[9px] font-mono text-slate-500">
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Story Telemetry Grid */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-2.5">
            <span className="text-[10px] text-slate-400 block">Monthly Fuel</span>
            <span className="font-bold text-slate-200 mt-0.5 block">
              {Number(goal.monthly_contribution || 0) > 0
                ? `₹${Number(goal.monthly_contribution).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo`
                : 'Not Set'}
            </span>
          </div>

          <div className={`rounded-xl border p-2.5 ${
            isOverdue
              ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
              : isDueSoon
              ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
              : 'bg-slate-950/60 border-slate-800/70 text-slate-300'
          }`}>
            <span className="text-[10px] text-slate-400 block">Summit Target</span>
            <span className="font-bold mt-0.5 block truncate">
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
          <div className="mt-3.5 pt-3 border-t border-slate-800/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Zap className="h-3 w-3 text-emerald-400" />
                Quick Fuel Boost:
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenSimulator(goal)
                }}
                className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-0.5"
              >
                Simulate <TrendingUp className="h-2.5 w-2.5" />
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
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900/80 py-1.5 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-200 transition-all text-center"
                >
                  +₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Action Controls */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onContribute(goal)
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Custom Funds
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(goal)
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
            title="Edit Goal"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(goal.id)
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
            title="Delete Goal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
