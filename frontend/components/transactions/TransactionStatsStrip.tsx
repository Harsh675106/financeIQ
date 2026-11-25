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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1. Total Inflow */}
      <div className="card card-pad card-spotlight group animate-fade-up">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl"
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 pt-1">
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="eyebrow truncate">Total Inflow</span>
            </div>
            <span className="icon-tile icon-tile-emerald">
              <ArrowUpRight className="h-[18px] w-[18px]" />
            </span>
          </div>

          <p className="kpi-value mt-3 break-words text-2xl text-emerald-400 2xl:text-[1.75rem]">
            +₹{Math.round(incomeTotal).toLocaleString('en-IN')}
          </p>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-xs text-slate-400">
            <span className="num min-w-0 truncate">{incomeCount} Income Events</span>
            <span className="flex shrink-0 items-center gap-1 font-semibold text-emerald-300">
              <TrendingUp className="h-3.5 w-3.5" /> Cash Added
            </span>
          </div>
        </div>
      </div>

      {/* 2. Total Outflow / Burn */}
      <div className="card card-pad card-spotlight group animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-rose-500/10 blur-2xl"
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 pt-1">
              <span className="flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-rose-400" aria-hidden="true" />
              <span className="eyebrow truncate">Total Outflow</span>
            </div>
            <span className="icon-tile icon-tile-rose">
              <ArrowDownRight className="h-[18px] w-[18px]" />
            </span>
          </div>

          <p className="kpi-value mt-3 break-words text-2xl text-rose-400 2xl:text-[1.75rem]">
            -₹{Math.round(expenseTotal).toLocaleString('en-IN')}
          </p>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-xs text-slate-400">
            <span className="num min-w-0 truncate">{expenseCount} Expenses Recorded</span>
            <span className="flex shrink-0 items-center gap-1 font-semibold text-rose-300">
              <Flame className="h-3.5 w-3.5" /> Burn Tracked
            </span>
          </div>
        </div>
      </div>

      {/* 3. Net Savings Rate */}
      <div className="card card-pad card-spotlight group animate-fade-up" style={{ animationDelay: '120ms' }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl"
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <span className="eyebrow truncate pt-1">Savings Velocity</span>
            <span className="icon-tile icon-tile-cyan">
              <Sparkles className="h-[18px] w-[18px]" />
            </span>
          </div>

          <p className="kpi-value mt-3 break-words text-2xl text-cyan-200 2xl:text-[1.75rem]">
            {savingsRate}% <span className="font-sans text-xs font-normal text-slate-400">Retained</span>
          </p>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3 text-xs text-slate-400">
            <div className="progress-track h-1.5 flex-1">
              <div
                className="progress-fill"
                style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
              />
            </div>
            <span className="badge badge-info shrink-0">
              {savingsRate >= 30 ? 'High Retention' : savingsRate > 0 ? 'Moderate' : 'Negative'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Net Cash Position */}
      <div className="card card-pad card-spotlight group animate-fade-up" style={{ animationDelay: '180ms' }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary-500/15 blur-2xl"
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <span className="eyebrow truncate pt-1">Net Cash Spread</span>
            <span className="icon-tile icon-tile-brand">
              <Wallet className="h-[18px] w-[18px]" />
            </span>
          </div>

          <p
            className={`kpi-value mt-3 break-words text-2xl 2xl:text-[1.75rem] ${
              netFlow >= 0 ? 'text-primary-200' : 'text-rose-400'
            }`}
          >
            {netFlow >= 0 ? '+' : ''}₹{Math.round(netFlow).toLocaleString('en-IN')}
          </p>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-xs text-slate-400">
            <span className="num min-w-0 truncate">{transactionCount} Total Logged</span>
            <span className={`badge shrink-0 uppercase tracking-wide ${netFlow >= 0 ? 'badge-success' : 'badge-danger'}`}>
              {netFlow >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
