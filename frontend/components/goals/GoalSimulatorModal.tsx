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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="story-glass-card relative w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-500/30 animate-pop-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Zap className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Storyline Journey Accelerator
              </h3>
              <p className="text-xs text-slate-400">
                Simulating velocity for <span className="text-emerald-300 font-semibold">{goal.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Storyline Speed Metrics */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 text-center">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Current Trajectory</span>
            <div className="mt-1 text-2xl font-black text-slate-200">
              {currentMonths} <span className="text-xs font-normal text-slate-400">months</span>
            </div>
            <span className="text-[10px] text-slate-500">at ₹{currentMonthly.toLocaleString('en-IN')}/mo</span>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 text-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-emerald-500/20 blur-xl"></div>
            <span className="text-[11px] font-mono text-emerald-400 uppercase font-semibold">Accelerated Speed</span>
            <div className="mt-1 text-2xl font-black text-emerald-300">
              {acceleratedMonths} <span className="text-xs font-normal text-emerald-400">months</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 font-bold">
              ⚡ Saves {monthsSaved} {monthsSaved === 1 ? 'month' : 'months'}
            </span>
          </div>
        </div>

        {/* Interactive Boost Slider */}
        <div className="mt-5 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">Extra Monthly Power Boost</span>
            <span className="font-mono font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
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
            className="w-full accent-emerald-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>+₹200</span>
            <span>+₹5,000</span>
            <span>+₹10,000</span>
            <span>+₹15,000</span>
          </div>
        </div>

        {/* Preset Boost Pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[500, 1000, 2500, 5000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setBoostMonthly(amt)}
              className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                boostMonthly === amt
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              +₹{amt.toLocaleString('en-IN')}
            </button>
          ))}
        </div>

        {/* Motivational Story Narrative */}
        <div className="mt-5 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3.5 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            By boosting your monthly fuel by <strong className="text-emerald-300">₹{boostMonthly.toLocaleString('en-IN')}</strong>, you reach the summit{' '}
            <strong className="text-emerald-400">{monthsSaved} months sooner</strong>, conquering your goal in approximately{' '}
            <strong className="text-slate-100">{acceleratedMonths} months</strong> instead of {currentMonths} months!
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onContributeQuick(goal, boostMonthly)
              onClose()
            }}
            className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:brightness-110 hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Apply ₹{boostMonthly.toLocaleString('en-IN')} Deposit Now
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
