'use client'

import React, { useState } from 'react'
import {
  Compass,
  Sparkles,
  Rocket,
  Flame,
  Mountain,
  Trophy,
  CheckCircle2,
  ArrowRight,
  Zap,
  Target,
  Clock,
  Coins,
  ChevronRight,
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

interface GoalStorylineMapProps {
  goals: Goal[]
  selectedGoalId: number | null
  onSelectGoal: (goalId: number) => void
  onContributeModal: (goal: Goal) => void
  onOpenSimulator: (goal: Goal) => void
}

interface StoryChapter {
  id: number
  name: string
  subtitle: string
  range: [number, number]
  icon: any
  color: string
  glow: string
  badgeBg: string
  description: string
}

const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 1,
    name: 'Chapter I: The Spark',
    subtitle: 'Foundation & Intent',
    range: [0, 24],
    icon: Sparkles,
    color: 'text-sky-600',
    glow: 'rgba(56, 189, 248, 0.22)',
    badgeBg: 'bg-sky-50 border-sky-200 text-sky-700',
    description: 'The journey begins. You declare your intention, plant the initial capital seed, and formulate the blueprint.',
  },
  {
    id: 2,
    name: 'Chapter II: The Ascent',
    subtitle: 'Building Velocity',
    range: [25, 49],
    icon: Rocket,
    color: 'text-teal-600',
    glow: 'rgba(20, 184, 166, 0.22)',
    badgeBg: 'bg-teal-50 border-teal-200 text-teal-700',
    description: 'Momentum is igniting. Regular contributions establish discipline, and compounding begins its subtle work.',
  },
  {
    id: 3,
    name: 'Chapter III: The Orbit',
    subtitle: 'Gravitational Escape',
    range: [50, 74],
    icon: Flame,
    color: 'text-indigo-600',
    glow: 'rgba(99, 102, 241, 0.2)',
    badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    description: 'The halfway threshold is crossed! You possess unstoppable capital velocity as your goal pulls within reachable distance.',
  },
  {
    id: 4,
    name: 'Chapter IV: Summit Horizon',
    subtitle: 'The Final Sprint',
    range: [75, 99],
    icon: Mountain,
    color: 'text-cyan-700',
    glow: 'rgba(34, 211, 238, 0.22)',
    badgeBg: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    description: 'The summit is crystal clear. One final disciplined push separates you from your vision becoming tangible reality.',
  },
  {
    id: 5,
    name: 'Chapter V: Zenith Victory',
    subtitle: 'Legendary Mastery',
    range: [100, 100],
    icon: Trophy,
    color: 'text-emerald-600',
    glow: 'rgba(16, 185, 129, 0.24)',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    description: 'Goal fully conquered! A monument to your discipline and foresight, unlocking freedom and new horizons.',
  },
]

export default function GoalStorylineMap({
  goals,
  selectedGoalId,
  onSelectGoal,
  onContributeModal,
  onOpenSimulator,
}: GoalStorylineMapProps) {
  if (goals.length === 0) return null

  // Current active selected goal - prioritize selected or the first active in-flight goal
  const inFlightGoal = goals.find((g) => (Number(g.current_amount) / Number(g.target_amount)) < 1)
  const activeGoal =
    goals.find((g) => g.id === selectedGoalId) || inFlightGoal || goals[0]

  const currentAmt = Number(activeGoal.current_amount || 0)
  const targetAmt = Number(activeGoal.target_amount || 1)
  const progress = Math.min(100, (currentAmt / targetAmt) * 100)

  // Find active chapter
  const currentChapter =
    STORY_CHAPTERS.find((ch) => progress >= ch.range[0] && progress <= ch.range[1]) ||
    (progress >= 100 ? STORY_CHAPTERS[4] : STORY_CHAPTERS[0])

  const remaining = Math.max(0, targetAmt - currentAmt)
  const monthlyPace = Number(activeGoal.monthly_contribution || 0)
  const estimatedMonths = monthlyPace > 0 ? Math.ceil(remaining / monthlyPace) : null

  return (
    <div className="story-glass-card relative overflow-hidden rounded-[1.25rem] p-5 animate-fade-up sm:p-7">
      {/* Background soft mint / ice wash with a few pastel sparkles */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-28 left-1/4 h-56 w-[28rem] max-w-full rounded-full bg-primary-100/60 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-48 w-80 max-w-full rounded-full bg-ice-100/70 blur-3xl" />
        <div className="opacity-70">
          <div className="star-twinkle-anim absolute left-12 top-6 h-1 w-1 rounded-full bg-primary-300" />
          <div className="star-twinkle-anim absolute right-24 top-14 h-1.5 w-1.5 rounded-full bg-ice-300 [animation-delay:1.2s]" />
          <div className="star-twinkle-anim absolute bottom-12 left-1/3 h-1 w-1 rounded-full bg-indigo-200 [animation-delay:2s]" />
          <div className="star-twinkle-anim absolute bottom-6 right-1/4 h-1.5 w-1.5 rounded-full bg-primary-200 [animation-delay:0.7s]" />
        </div>
      </div>

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile icon-tile-lg icon-tile-brand">
            <Compass className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="eyebrow text-primary-700">
                Interactive Odyssey Map
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-ice-500 animate-pulse" aria-hidden="true" />
            </div>
            <h2 className="mt-0.5 font-display text-lg font-semibold tracking-tight text-ink-900 sm:text-xl">
              The Wealth Journey Storyline
            </h2>
          </div>
        </div>

        {/* Goal Selector Switcher */}
        <div className="scroll-thin -mx-1 flex min-w-0 max-w-full items-center gap-1.5 overflow-x-auto px-1 pb-1 md:max-w-[55%]">
          {goals.map((g) => {
            const isSelected = g.id === activeGoal.id
            const gProgress = Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100)
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onSelectGoal(g.id)}
                aria-pressed={isSelected}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  isSelected
                    ? 'border-primary-300 bg-primary-50 text-primary-800 shadow-xs'
                    : 'border-line bg-white text-slate-600 hover:border-line-strong hover:bg-slate-50 hover:text-ink-900'
                }`}
              >
                <span className="max-w-[120px] truncate">{g.name}</span>
                <span className={`num rounded-full px-1.5 text-[10px] leading-4 ${
                  gProgress >= 100
                    ? 'bg-emerald-100 font-semibold text-emerald-700'
                    : isSelected
                    ? 'bg-white text-primary-700 ring-1 ring-primary-200'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {gProgress.toFixed(0)}%
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Visual Storyline Track */}
      <div className="relative z-10 my-6 py-4 sm:my-8">
        {/* Track Line Background (Desktop Horizontal Trail) */}
        <div className="relative mb-12 hidden lg:block">
          {/* Pale Base Path */}
          <div className="absolute left-6 right-6 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full bg-[#E6EFEC] shadow-[inset_0_1px_2px_rgba(16,40,38,0.08)]">
            {/* Filled Progress Beam (mint → ice, emerald when complete) */}
            <div
              className={`progress-fill neon-progress-bar ${
                progress >= 100
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                  : ''
              }`}
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>

          {/* SVG Animated Route (soft white dashes travelling along the track) */}
          <svg className="pointer-events-none absolute left-6 right-6 top-1/2 h-6 w-[calc(100%-3rem)] -translate-y-1/2 overflow-visible" aria-hidden="true">
            <line
              x1="0"
              y1="12"
              x2="100%"
              y2="12"
              className="odyssey-animated-track stroke-white/70"
              strokeWidth="2"
            />
          </svg>

          {/* 5 Milestone Checkpoint Nodes */}
          <div className="relative flex items-center justify-between">
            {STORY_CHAPTERS.map((ch, idx) => {
              const Icon = ch.icon
              const isPast = progress >= ch.range[1]
              const isCurrent = progress >= ch.range[0] && (idx === 4 ? progress >= 100 : progress <= ch.range[1])

              return (
                <div key={ch.id} className="group relative z-10 flex flex-col items-center">
                  {/* Milestone Node */}
                  <div className="relative flex items-center justify-center">
                    {/* Active Beacon Ripple Ring */}
                    {isCurrent && (
                      <div className="odyssey-beacon-ripple pointer-events-none absolute inset-0 -m-3 rounded-full border-2 border-primary-300" />
                    )}

                    <div
                      className={`relative flex h-14 w-14 items-center justify-center rounded-2xl transition-[transform,background-color,border-color,box-shadow,color] duration-500 ${
                        isPast || (idx === 4 && progress >= 100)
                          ? idx === 4
                            ? 'scale-105 bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-[0_10px_24px_-12px_rgba(5,150,105,0.6)]'
                            : 'scale-105 border-2 border-primary-200 bg-white text-primary-600 shadow-card'
                          : isCurrent
                          ? 'scale-110 border-2 border-primary-500 bg-white text-primary-600 shadow-[0_0_0_4px_rgba(16,185,129,0.12),0_10px_24px_-12px_rgba(5,150,105,0.45)]'
                          : 'border border-line-strong bg-white text-slate-400 shadow-xs'
                      }`}
                    >
                      <Icon className="h-6 w-6 transition-transform motion-safe:group-hover:scale-110" />

                      {isPast && (
                        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ice-600 text-white shadow-xs ring-2 ring-white">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chapter Label */}
                  <div className="mt-3 text-center">
                    <span className={`block text-xs font-semibold transition-colors ${
                      isCurrent ? 'text-primary-700' : isPast ? 'text-ink-800' : 'text-slate-500'
                    }`}>
                      {ch.subtitle}
                    </span>
                    <span className="num text-[10px] text-slate-500">
                      {idx === 0 ? '0%' : idx === 1 ? '25%' : idx === 2 ? '50%' : idx === 3 ? '75%' : '100%'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile Vertical Chapter Stack */}
        <div className="mb-6 block space-y-3 lg:hidden">
          <div className="progress-track mb-4 h-3">
            <div
              className={`progress-fill neon-progress-bar ${
                progress >= 100
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                  : ''
              }`}
              style={{ width: `${Math.max(4, progress)}%` }}
            />
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {STORY_CHAPTERS.map((ch, idx) => {
              const Icon = ch.icon
              const isPast = progress >= ch.range[1]
              const isCurrent = progress >= ch.range[0] && (idx === 4 ? progress >= 100 : progress <= ch.range[1])
              return (
                <div
                  key={ch.id}
                  className={`flex min-w-0 flex-col items-center rounded-xl border p-2 text-center transition-colors ${
                    isCurrent
                      ? 'border-primary-300 bg-primary-50 text-primary-700 shadow-xs'
                      : isPast
                      ? 'border-primary-100 bg-white text-ink-700'
                      : 'border-line bg-slate-50 text-slate-500'
                  }`}
                >
                  <Icon className="mb-1 h-4 w-4" />
                  <span className="w-full truncate text-[9px] font-semibold">{ch.subtitle}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Dynamic Story Lore Card */}
        <div className="surface-highlight relative overflow-hidden p-5 sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/60 to-transparent"
          />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold leading-5 ${currentChapter.badgeBg}`}>
                  {React.createElement(currentChapter.icon, { className: 'h-3.5 w-3.5' })}
                  {currentChapter.name}
                </span>
                <span className="num text-xs text-slate-500">
                  Coordinates: <strong className="font-semibold text-ink-900">₹{currentAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> of ₹{targetAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({progress.toFixed(1)}%)
                </span>
              </div>

              <h3 className="break-words font-display text-lg font-semibold tracking-tight text-ink-900">
                {activeGoal.name} • {currentChapter.subtitle}
              </h3>

              <p className="max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm">
                {currentChapter.description}
              </p>

              {/* Real-Time Quest Insights */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                <span className="num inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1 text-ink-700 shadow-xs">
                  <Coins className="h-3.5 w-3.5 text-primary-600" />
                  Remaining: ₹{remaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                {monthlyPace > 0 && (
                  <span className="num inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1 text-ink-700 shadow-xs">
                    <Zap className="h-3.5 w-3.5 text-ice-600" />
                    Pace: ₹{monthlyPace.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo
                  </span>
                )}
                {estimatedMonths !== null && (
                  <span className="num inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700">
                    <Clock className="h-3.5 w-3.5" />
                    Projected Conquest: ~{estimatedMonths} {estimatedMonths === 1 ? 'month' : 'months'}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions inside Map */}
            <div className="flex shrink-0 flex-wrap items-center gap-2.5 sm:flex-nowrap">
              <button
                type="button"
                onClick={() => onOpenSimulator(activeGoal)}
                className="btn-secondary h-10 flex-1 sm:flex-none"
              >
                <Zap className="h-4 w-4 text-ice-600" />
                Simulate Speedup
              </button>

              <button
                type="button"
                onClick={() => onContributeModal(activeGoal)}
                className="btn-primary h-10 flex-1 sm:flex-none"
              >
                <Coins className="h-4 w-4" />
                Add Funds
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
