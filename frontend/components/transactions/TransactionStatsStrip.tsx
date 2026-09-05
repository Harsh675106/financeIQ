'use client'

import { useMemo } from 'react'
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Zap,
  ShieldCheck,
  Sparkles,
  Flame
} from 'lucide-react'

interface TransactionStatsStripProps {
  incomeTotal: number
  expenseTotal: number
  transactionCount: number
  incomeCount: number
  expenseCount: number
}

export default function TransactionStatsStrip({
  incomeTotal,
  expenseTotal,
  transactionCount,
  incomeCount,
  expenseCount,
}: TransactionStatsStripProps) {
  const netFlow = incomeTotal - expenseTotal
  const savingsRate = incomeTotal > 0 ? Math.round(((incomeTotal - expenseTotal) / incomeTotal) * 100) : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Inflow */}
      <div className="group relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950/95 p-5 shadow-2xl backdrop-blur-xl stage-card-lift">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/15 blur-2xl group-hover:scale-150 transition-all duration-500" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Inflow</span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 shadow-inner group-hover:scale-110 transition">
            <ArrowUpRight className="h-4.5 w-4.5 text-emerald-400" />
          </div>
        </div>

        <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400">
          +₹{Math.round(incomeTotal).toLocaleString('en-IN')}
        </p>

        <div className="flex items-center justify-between mt-4 text-xs text-slate-400 border-t border-slate-800/90 pt-3">
          <span className="font-medium">{incomeCount} Income Events</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> Cash Added
          </span>
        </div>
      </div>

      {/* 2. Total Outflow / Burn */}
      <div className="group relative overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-slate-900/90 to-slate-950/95 p-5 shadow-2xl backdrop-blur-xl stage-card-lift">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-500/15 blur-2xl group-hover:scale-150 transition-all duration-500" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Outflow</span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 shadow-inner group-hover:scale-110 transition">
            <ArrowDownRight className="h-4.5 w-4.5 text-rose-400" />
          </div>
        </div>

        <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-rose-400">
          -₹{Math.round(expenseTotal).toLocaleString('en-IN')}
        </p>

        <div className="flex items-center justify-between mt-4 text-xs text-slate-400 border-t border-slate-800/90 pt-3">
          <span className="font-medium">{expenseCount} Expenses Recorded</span>
          <span className="text-rose-400 font-bold flex items-center gap-1">
            <Flame className="h-3.5 w-3.5" /> Burn Tracked
          </span>
        </div>
      </div>

      {/* 3. Net Savings Rate */}
      <div className="group relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-950/95 p-5 shadow-2xl backdrop-blur-xl stage-card-lift">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-500/15 blur-2xl group-hover:scale-150 transition-all duration-500" />

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Savings Velocity</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 shadow-inner group-hover:scale-110 transition">
            <Sparkles className="h-4.5 w-4.5 text-cyan-400" />
          </div>
        </div>

        <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-cyan-300">
          {savingsRate}% <span className="text-xs text-slate-400 font-normal">Retained</span>
        </p>

        <div className="flex items-center justify-between mt-4 text-xs text-slate-400 border-t border-slate-800/90 pt-3">
          <div className="h-2 flex-1 rounded-full bg-slate-800 overflow-hidden mr-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-700"
              style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
            />
          </div>
          <span className="text-cyan-400 font-bold text-[11px] whitespace-nowrap">
            {savingsRate >= 30 ? 'High Retention' : savingsRate > 0 ? 'Moderate' : 'Negative'}
          </span>
        </div>
      </div>

      {/* 4. Net Cash Position */}
      <div className="group relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950/95 p-5 shadow-2xl backdrop-blur-xl stage-card-lift">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-500/15 blur-2xl group-hover:scale-150 transition-all duration-500" />

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Cash Spread</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30 shadow-inner group-hover:scale-110 transition">
            <Wallet className="h-4.5 w-4.5 text-indigo-400" />
          </div>
        </div>

        <p className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${netFlow >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
          {netFlow >= 0 ? '+' : ''}₹{Math.round(netFlow).toLocaleString('en-IN')}
        </p>

        <div className="flex items-center justify-between mt-4 text-xs text-slate-400 border-t border-slate-800/90 pt-3">
          <span>{transactionCount} Total Logged</span>
          <span className={`font-bold uppercase ${netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netFlow >= 0 ? 'Surplus' : 'Deficit'}
          </span>
        </div>
      </div>
    </div>
  )
}
