'use client'

import React, { useState } from 'react'
import { Zap, Calendar, TrendingUp, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react'

interface Goal {
  id: number
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  monthly_contribution: number
  status: 'active' | 'completed' | 'paused'
}

interface GoalSimulatorModalProps {
  goal: Goal
  isOpen: boolean
  onClose: () => void
  onContributeQuick: (goal: Goal, amount: number) => void
}

export default function GoalSimulatorModal({
  goal,
  isOpen,
  onClose,
  onContributeQuick,
}: GoalSimulatorModalProps) {
  const [boostMonthly, setBoostMonthly] = useState<number>(1000)

  if (!isOpen) return null

  const remaining = Math.max(0, goal.target_amount - goal.current_amount)
  const currentMonthly = goal.monthly_contribution || 500

  // Standard months to reach goal at current rate
  const currentMonths = Math.ceil(remaining / Math.max(1, currentMonthly))
  
  // Accelerated rate
  const newMonthly = currentMonthly + boostMonthly
  const acceleratedMonths = Math.ceil(remaining / Math.max(1, newMonthly))
  const monthsSaved = Math.max(0, currentMonths - acceleratedMonths)

  return (
    <div className="modal-backdrop animate-fade-in">
      <div
        className="modal-panel max-w-lg overflow-y-auto p-5 animate-pop-in sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Storyline Journey Accelerator"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/60 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary-500/15 blur-3xl"
        />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="icon-tile icon-tile-brand">
              <Zap className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold tracking-tight text-white">
                Storyline Journey Accelerator
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Simulating velocity for <span className="break-words font-semibold text-primary-200">{goal.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Storyline Speed Metrics */}
        <div className="relative mt-5 grid grid-cols-2 gap-3">
          <div className="surface-inset p-3.5 text-center">
            <span className="eyebrow text-[10px]">Current Trajectory</span>
            <div className="kpi-value mt-1.5 text-2xl text-slate-200">
              {currentMonths} <span className="font-sans text-xs font-normal text-slate-400">months</span>
            </div>
            <span className="num text-[10px] text-slate-500">at ₹{currentMonthly.toLocaleString('en-IN')}/mo</span>
          </div>

          <div className="relative overflow-hidden rounded-[0.875rem] border border-primary-400/30 bg-gradient-to-br from-primary-500/15 via-violet-500/10 to-cyan-500/10 p-3.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-cyan-400/20 blur-xl"></div>
            <span className="eyebrow relative text-[10px] text-primary-200">Accelerated Speed</span>
            <div className="kpi-value relative mt-1.5 text-2xl">
              <span className="text-gradient">{acceleratedMonths}</span> <span className="font-sans text-xs font-normal text-primary-200">months</span>
            </div>
            <span className="relative text-[10px] font-semibold text-emerald-300">
              ⚡ Saves {monthsSaved} {monthsSaved === 1 ? 'month' : 'months'}
            </span>
          </div>
        </div>

        {/* Interactive Boost Slider */}
        <div className="relative mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-slate-300">Extra Monthly Power Boost</span>
            <span className="badge badge-brand num text-xs">
              +₹{boostMonthly.toLocaleString('en-IN')}/mo
            </span>
          </div>

          <input
            type="range"
            min="200"
            max="15000"
            step="200"
            value={boostMonthly}
            onChange={(e) => setBoostMonthly(Number(e.target.value))}
            className="pf-range cursor-pointer"
            aria-label="Extra Monthly Power Boost"
          />

          <div className="num flex justify-between text-[10px] text-slate-500">
            <span>+₹200</span>
            <span>+₹5,000</span>
            <span>+₹10,000</span>
            <span>+₹15,000</span>
          </div>
        </div>

        {/* Preset Boost Pills */}
        <div className="relative mt-4 flex flex-wrap gap-2">
          {[500, 1000, 2500, 5000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setBoostMonthly(amt)}
              aria-pressed={boostMonthly === amt}
              className={`num rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                boostMonthly === amt
                  ? 'border-primary-400/50 bg-primary-500/20 text-white shadow-[0_4px_16px_-6px_rgba(112,104,244,0.8)]'
                  : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/15 hover:text-slate-100'
              }`}
            >
              +₹{amt.toLocaleString('en-IN')}
            </button>
          ))}
        </div>

        {/* Motivational Story Narrative */}
        <div className="surface-inset relative mt-5 flex items-start gap-3 p-3.5">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary-300" />
          <p className="text-xs leading-relaxed text-slate-300">
            By boosting your monthly fuel by <strong className="font-semibold text-primary-200">₹{boostMonthly.toLocaleString('en-IN')}</strong>, you reach the summit{' '}
            <strong className="font-semibold text-emerald-300">{monthsSaved} months sooner</strong>, conquering your goal in approximately{' '}
            <strong className="font-semibold text-slate-100">{acceleratedMonths} months</strong> instead of {currentMonths} months!
          </p>
        </div>

        {/* Actions */}
        <div className="relative mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              onContributeQuick(goal, boostMonthly)
              onClose()
            }}
            className="btn-primary h-11 flex-1"
          >
            <Sparkles className="h-4 w-4" />
            Apply ₹{boostMonthly.toLocaleString('en-IN')} Deposit Now
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary h-11"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
