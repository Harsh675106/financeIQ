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
    color: 'text-sky-300',
    glow: 'rgba(56, 189, 248, 0.4)',
    badgeBg: 'bg-sky-500/10 border-sky-400/25 text-sky-200',
    description: 'The journey begins. You declare your intention, plant the initial capital seed, and formulate the blueprint.',
  },
  {
    id: 2,
    name: 'Chapter II: The Ascent',
    subtitle: 'Building Velocity',
    range: [25, 49],
    icon: Rocket,
    color: 'text-primary-300',
    glow: 'rgba(112, 104, 244, 0.45)',
    badgeBg: 'bg-primary-500/15 border-primary-400/30 text-primary-200',
    description: 'Momentum is igniting. Regular contributions establish discipline, and compounding begins its subtle work.',
  },
  {
    id: 3,
    name: 'Chapter III: The Orbit',
    subtitle: 'Gravitational Escape',
    range: [50, 74],
    icon: Flame,
    color: 'text-violet-300',
    glow: 'rgba(139, 92, 246, 0.45)',
    badgeBg: 'bg-violet-500/15 border-violet-400/30 text-violet-200',
    description: 'The halfway threshold is crossed! You possess unstoppable capital velocity as your goal pulls within reachable distance.',
  },
  {
    id: 4,
    name: 'Chapter IV: Summit Horizon',
    subtitle: 'The Final Sprint',
    range: [75, 99],
    icon: Mountain,
    color: 'text-cyan-300',
    glow: 'rgba(34, 211, 238, 0.45)',
    badgeBg: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-200',
    description: 'The summit is crystal clear. One final disciplined push separates you from your vision becoming tangible reality.',
  },
  {
    id: 5,
    name: 'Chapter V: Zenith Victory',
    subtitle: 'Legendary Mastery',
    range: [100, 100],
    icon: Trophy,
    color: 'text-emerald-300',
    glow: 'rgba(52, 211, 153, 0.5)',
    badgeBg: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200',
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
      {/* Background Starfield Decor */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-28 left-1/4 h-56 w-[28rem] max-w-full rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-48 w-80 max-w-full rounded-full bg-cyan-500/[0.07] blur-3xl" />
        <div className="opacity-50">
          <div className="star-twinkle-anim absolute left-12 top-6 h-1 w-1 rounded-full bg-primary-300 shadow-[0_0_8px_#a9acff]" />
          <div className="star-twinkle-anim absolute right-24 top-14 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] [animation-delay:1.2s]" />
          <div className="star-twinkle-anim absolute bottom-12 left-1/3 h-1 w-1 rounded-full bg-violet-300 shadow-[0_0_6px_#a78bfa] [animation-delay:2s]" />
          <div className="star-twinkle-anim absolute bottom-6 right-1/4 h-1.5 w-1.5 rounded-full bg-primary-200 shadow-[0_0_8px_#cacdff] [animation-delay:0.7s]" />
        </div>
      </div>

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col gap-4 border-b border-white/[0.06] pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile icon-tile-lg icon-tile-brand">
            <Compass className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="eyebrow text-primary-300">
                Interactive Odyssey Map
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" aria-hidden="true" />
            </div>
            <h2 className="mt-0.5 font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
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
                    ? 'border-primary-400/45 bg-primary-500/15 text-white shadow-[0_6px_20px_-10px_rgba(112,104,244,0.8)]'
                    : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/15 hover:text-slate-100'
                }`}
              >
                <span className="max-w-[120px] truncate">{g.name}</span>
                <span className={`num rounded-full px-1.5 text-[10px] leading-4 ${
                  gProgress >= 100
                    ? 'bg-emerald-500/20 font-semibold text-emerald-300'
                    : isSelected
                    ? 'bg-primary-400/25 text-primary-100'
                    : 'bg-white/[0.06] text-slate-400'
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
          {/* Glowing Base Path */}
          <div className="absolute left-6 right-6 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/[0.06] shadow-[inset_0_1px_1px_rgba(0,0,0,0.35)]">
            {/* Filled Progress Beam */}
            <div
              className={`progress-fill neon-progress-bar ${
                progress >= 100
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_16px_-2px_rgba(52,211,153,0.8)]'
                  : 'shadow-[0_0_18px_-2px_rgba(138,136,251,0.85)]'
              }`}
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>

          {/* SVG Animated Particle Route */}
          <svg className="pointer-events-none absolute left-6 right-6 top-1/2 h-6 w-[calc(100%-3rem)] -translate-y-1/2 overflow-visible" aria-hidden="true">
            <line
              x1="0"
              y1="12"
              x2="100%"
              y2="12"
              className="odyssey-animated-track stroke-primary-200/30"
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
                  {/* Glowing Node Button */}
                  <div className="relative flex items-center justify-center">
                    {/* Active Beacon Ripple Rings */}
                    {isCurrent && (
                      <div className="odyssey-beacon-ripple pointer-events-none absolute inset-0 -m-3 rounded-full border-2 border-primary-400/70" />
                    )}

                    <div
                      className={`relative flex h-14 w-14 items-center justify-center rounded-2xl transition-[transform,background-color,border-color,box-shadow,color] duration-500 ${
                        isPast || (idx === 4 && progress >= 100)
                          ? idx === 4
                            ? 'scale-105 bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-[0_0_26px_rgba(52,211,153,0.45)]'
                            : 'scale-105 bg-gradient-to-br from-primary-500 to-violet-600 text-white shadow-[0_0_24px_rgba(112,104,244,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]'
                          : isCurrent
                          ? 'scale-110 border-2 border-primary-400 bg-slate-900 text-primary-200 shadow-[0_0_30px_rgba(112,104,244,0.55)]'
                          : 'border border-white/10 bg-slate-900 text-slate-500'
                      }`}
                    >
                      <Icon className="h-6 w-6 transition-transform motion-safe:group-hover:scale-110" />

                      {isPast && (
                        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-300 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.6)] ring-2 ring-slate-950">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chapter Label */}
                  <div className="mt-3 text-center">
                    <span className={`block text-xs font-semibold transition-colors ${
                      isCurrent ? 'text-primary-200' : isPast ? 'text-slate-200' : 'text-slate-500'
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
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_12px_-2px_rgba(52,211,153,0.75)]'
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
                      ? 'border-primary-400/50 bg-primary-500/15 text-primary-100 shadow-[0_6px_20px_-10px_rgba(112,104,244,0.8)]'
                      : isPast
                      ? 'border-white/10 bg-white/[0.05] text-slate-300'
                      : 'border-white/[0.05] bg-white/[0.02] text-slate-600'
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
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-950/60 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary-300/60 to-transparent"
          />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold leading-5 ${currentChapter.badgeBg}`}>
                  {React.createElement(currentChapter.icon, { className: 'h-3.5 w-3.5' })}
                  {currentChapter.name}
                </span>
                <span className="num text-xs text-slate-400">
                  Coordinates: <strong className="font-semibold text-slate-100">₹{currentAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> of ₹{targetAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({progress.toFixed(1)}%)
                </span>
              </div>

              <h3 className="break-words font-display text-lg font-semibold tracking-tight text-white sm:text-xl">
                {activeGoal.name} • {currentChapter.subtitle}
              </h3>

              <p className="max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
                {currentChapter.description}
              </p>

              {/* Real-Time Quest Insights */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                <span className="num inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-slate-300">
                  <Coins className="h-3.5 w-3.5 text-primary-300" />
                  Remaining: ₹{remaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                {monthlyPace > 0 && (
                  <span className="num inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-slate-300">
                    <Zap className="h-3.5 w-3.5 text-cyan-300" />
                    Pace: ₹{monthlyPace.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo
                  </span>
                )}
                {estimatedMonths !== null && (
                  <span className="num inline-flex items-center gap-1.5 rounded-lg border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 font-semibold text-violet-200">
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
                <Zap className="h-4 w-4 text-cyan-300" />
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
