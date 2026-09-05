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
    color: 'text-amber-400',
    glow: 'rgba(245, 158, 11, 0.4)',
    badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    description: 'The journey begins. You declare your intention, plant the initial capital seed, and formulate the blueprint.',
  },
  {
    id: 2,
    name: 'Chapter II: The Ascent',
    subtitle: 'Building Velocity',
    range: [25, 49],
    icon: Rocket,
    color: 'text-teal-400',
    glow: 'rgba(20, 184, 166, 0.4)',
    badgeBg: 'bg-teal-500/15 border-teal-500/30 text-teal-300',
    description: 'Momentum is igniting. Regular contributions establish discipline, and compounding begins its subtle work.',
  },
  {
    id: 3,
    name: 'Chapter III: The Orbit',
    subtitle: 'Gravitational Escape',
    range: [50, 74],
    icon: Flame,
    color: 'text-cyan-400',
    glow: 'rgba(6, 182, 212, 0.4)',
    badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
    description: 'The halfway threshold is crossed! You possess unstoppable capital velocity as your goal pulls within reachable distance.',
  },
  {
    id: 4,
    name: 'Chapter IV: Summit Horizon',
    subtitle: 'The Final Sprint',
    range: [75, 99],
    icon: Mountain,
    color: 'text-emerald-400',
    glow: 'rgba(16, 185, 129, 0.5)',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    description: 'The summit is crystal clear. One final disciplined push separates you from your vision becoming tangible reality.',
  },
  {
    id: 5,
    name: 'Chapter V: Zenith Victory',
    subtitle: 'Legendary Mastery',
    range: [100, 100],
    icon: Trophy,
    color: 'text-yellow-300',
    glow: 'rgba(253, 224, 71, 0.6)',
    badgeBg: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-200',
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

  // Current active selected goal
  const activeGoal = goals.find((g) => g.id === selectedGoalId) || goals[0]
  const progress = Math.min(100, (activeGoal.current_amount / activeGoal.target_amount) * 100)

  // Find active chapter
  const currentChapter =
    STORY_CHAPTERS.find((ch) => progress >= ch.range[0] && progress <= ch.range[1]) ||
    (progress >= 100 ? STORY_CHAPTERS[4] : STORY_CHAPTERS[0])

  const remaining = Math.max(0, activeGoal.target_amount - activeGoal.current_amount)
  const monthlyPace = activeGoal.monthly_contribution || 0
  const estimatedMonths = monthlyPace > 0 ? Math.ceil(remaining / monthlyPace) : null

  return (
    <div className="story-glass-card relative overflow-hidden rounded-3xl p-5 sm:p-7 shadow-2xl border border-emerald-500/20 animate-fade-up">
      {/* Background Starfield Decor */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="star-twinkle-anim absolute top-6 left-12 h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        <div className="star-twinkle-anim absolute top-14 right-24 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] [animation-delay:1.2s]" />
        <div className="star-twinkle-anim absolute bottom-12 left-1/3 h-1 w-1 rounded-full bg-teal-300 shadow-[0_0_6px_#2dd4bf] [animation-delay:2s]" />
        <div className="star-twinkle-anim absolute bottom-6 right-1/4 h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fcd34d] [animation-delay:0.7s]" />
      </div>

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-cyan-500/20 border border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            <Compass className="h-6 w-6 animate-spin [animation-duration:15s]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Interactive Odyssey Map
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-50 tracking-tight">
              The Wealth Journey Storyline
            </h2>
          </div>
        </div>

        {/* Goal Selector Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {goals.map((g) => {
            const isSelected = g.id === activeGoal.id
            const gProgress = Math.min(100, (g.current_amount / g.target_amount) * 100)
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onSelectGoal(g.id)}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="max-w-[120px] truncate">{g.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  gProgress >= 100
                    ? 'bg-yellow-500/20 text-yellow-300 font-bold'
                    : isSelected
                    ? 'bg-emerald-500/30 text-emerald-200'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {gProgress.toFixed(0)}%
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Visual Storyline Track */}
      <div className="relative z-10 my-8 py-4">
        {/* Track Line Background (Desktop Horizontal Trail) */}
        <div className="hidden lg:block relative mb-12">
          {/* Glowing Base Path */}
          <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-2.5 rounded-full bg-slate-900 border border-slate-800 shadow-inner overflow-hidden">
            {/* Filled Progress Beam */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-1000 neon-progress-bar shadow-[0_0_20px_rgba(16,185,129,0.8)]"
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>

          {/* SVG Animated Particle Route */}
          <svg className="absolute top-1/2 left-6 right-6 -translate-y-1/2 w-[calc(100%-3rem)] h-6 pointer-events-none overflow-visible">
            <line
              x1="0"
              y1="12"
              x2="100%"
              y2="12"
              className="odyssey-animated-track stroke-emerald-300/40"
              strokeWidth="2"
            />
          </svg>

          {/* 5 Milestone Checkpoint Nodes */}
          <div className="relative flex justify-between items-center">
            {STORY_CHAPTERS.map((ch, idx) => {
              const Icon = ch.icon
              const isPast = progress >= ch.range[1]
              const isCurrent = progress >= ch.range[0] && (idx === 4 ? progress >= 100 : progress <= ch.range[1])

              return (
                <div key={ch.id} className="flex flex-col items-center group relative z-10">
                  {/* Glowing Node Button */}
                  <div className="relative flex items-center justify-center">
                    {/* Active Beacon Ripple Rings */}
                    {isCurrent && (
                      <div className="absolute inset-0 -m-3 rounded-full border-2 border-emerald-400 odyssey-beacon-ripple pointer-events-none" />
                    )}

                    <div
                      className={`relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-500 ${
                        isPast || (idx === 4 && progress >= 100)
                          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105'
                          : isCurrent
                          ? 'bg-slate-900 border-2 border-emerald-400 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.6)] scale-110'
                          : 'bg-slate-900/90 border border-slate-800 text-slate-500'
                      }`}
                    >
                      <Icon className="h-6 w-6 transition-transform group-hover:scale-110" />

                      {isPast && (
                        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-md">
                          <CheckCircle2 className="h-3 w-3 font-bold" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chapter Label */}
                  <div className="mt-3 text-center">
                    <span className={`block text-xs font-bold transition-colors ${
                      isCurrent ? 'text-emerald-300 scale-105' : isPast ? 'text-slate-200' : 'text-slate-500'
                    }`}>
                      {ch.subtitle}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {idx === 0 ? '0%' : idx === 1 ? '25%' : idx === 2 ? '50%' : idx === 3 ? '75%' : '100%'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile Vertical Chapter Stack */}
        <div className="block lg:hidden space-y-3 mb-6">
          <div className="w-full bg-slate-900/80 rounded-full h-3.5 border border-slate-800 p-0.5 overflow-hidden mb-4">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700 neon-progress-bar shadow-[0_0_15px_rgba(16,185,129,0.6)]"
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
                  className={`flex flex-col items-center p-2 rounded-xl text-center border transition-all ${
                    isCurrent
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : isPast
                      ? 'bg-slate-900/90 border-slate-700 text-slate-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4 mb-1" />
                  <span className="text-[9px] font-bold truncate w-full">{ch.subtitle}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Dynamic Story Lore Card */}
        <div className="relative rounded-3xl border border-slate-800/90 bg-slate-950/80 p-5 sm:p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold ${currentChapter.badgeBg}`}>
                  {React.createElement(currentChapter.icon, { className: 'h-3.5 w-3.5' })}
                  {currentChapter.name}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Coordinates: <strong className="text-slate-200">₹{activeGoal.current_amount.toLocaleString('en-IN')}</strong> of ₹{activeGoal.target_amount.toLocaleString('en-IN')} ({progress.toFixed(1)}%)
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-100">
                {activeGoal.name} • {currentChapter.subtitle}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {currentChapter.description}
              </p>

              {/* Real-Time Quest Insights */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <Coins className="h-3.5 w-3.5 text-emerald-400" />
                  Remaining: ₹{remaining.toLocaleString('en-IN')}
                </span>
                {monthlyPace > 0 && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <Zap className="h-3.5 w-3.5 text-cyan-400" />
                    Pace: ₹{monthlyPace.toLocaleString('en-IN')}/mo
                  </span>
                )}
                {estimatedMonths !== null && (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Clock className="h-3.5 w-3.5" />
                    Projected Conquest: ~{estimatedMonths} {estimatedMonths === 1 ? 'month' : 'months'}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions inside Map */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onOpenSimulator(activeGoal)}
                className="flex items-center gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-300 transition-all hover:bg-cyan-500/20 hover:border-cyan-400"
              >
                <Zap className="h-4 w-4" />
                Simulate Speedup
              </button>

              <button
                type="button"
                onClick={() => onContributeModal(activeGoal)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
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
