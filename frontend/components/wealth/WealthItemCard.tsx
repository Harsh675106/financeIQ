'use client'

import { useState } from 'react'
import {
  Edit,
  Trash2,
  PiggyBank,
  AlertCircle,
  TrendingUp,
  Zap,
  CreditCard,
  Building,
  Car,
  Home,
  Coins,
  ShieldAlert,
  ArrowUpRight,
  PlusCircle,
  MinusCircle,
  Sparkles,
  Wallet,
  Clock
} from 'lucide-react'

export interface WealthItem {
  id: number
  type?: string
  account_type?: string
  debt_type?: string
  amount?: number
  interest_rate?: number
  rate?: number
  quantity?: number
  price?: number
  symbol?: string
  description?: string
  purchase_date?: string
  due_date?: string
  created_at?: string
  updated_at?: string
}

export type WealthCategory = 'savings' | 'debts' | 'assets' | 'liabilities'

interface WealthItemCardProps {
  item: WealthItem
  category: WealthCategory
  index: number
  onEdit: (item: WealthItem, category: WealthCategory) => void
  onDelete: (id: number, category: WealthCategory) => void
  onQuickAdjust?: (item: WealthItem, category: WealthCategory) => void
}

export default function WealthItemCard({
  item,
  category,
  index,
  onEdit,
  onDelete,
  onQuickAdjust,
}: WealthItemCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Determine title, subtitle, amount, and badge info
  let title = 'Item'
  let subtitle = item.description || 'No description added'
  let amount = 0
  let badgeText = ''
  let isHighApr = false

  if (category === 'savings') {
    title = item.account_type || 'Savings Account'
    amount = item.amount || 0
    badgeText = 'Liquid Asset'
  } else if (category === 'debts') {
    title = item.debt_type || 'Debt / Loan'
    amount = item.amount || 0
    if (item.interest_rate && item.interest_rate > 0) {
      badgeText = `${item.interest_rate}% APR`
      if (item.interest_rate >= 14) isHighApr = true
    } else {
      badgeText = '0% Interest'
    }
  } else if (category === 'assets') {
    title = item.type || 'Asset'
    if (item.symbol) title += ` (${item.symbol.toUpperCase()})`
    amount = (item.quantity || 0) * (item.price || 0)
    subtitle = `Qty: ${item.quantity} × ₹${Math.round(item.price || 0).toLocaleString('en-IN')}`
    if (item.purchase_date) {
      subtitle += ` • Acquired: ${new Date(item.purchase_date).toLocaleDateString('en-IN')}`
    }
  } else if (category === 'liabilities') {
    title = item.type || 'Liability'
    amount = item.amount || 0
    if (item.rate) badgeText = `${item.rate}% Rate`
    if (item.due_date) {
      subtitle = `Due date: ${new Date(item.due_date).toLocaleDateString('en-IN')}`
    }
  }

  // Dynamic Icon Selection
  const getCategoryIcon = () => {
    const t = (title + ' ' + (item.debt_type || '') + ' ' + (item.account_type || '')).toLowerCase()
    if (t.includes('card')) return <CreditCard className="h-5 w-5 text-rose-400" />
    if (t.includes('home') || t.includes('mortgage') || t.includes('real estate') || t.includes('property'))
      return <Home className="h-5 w-5 text-indigo-400" />
    if (t.includes('car') || t.includes('vehicle') || t.includes('auto'))
      return <Car className="h-5 w-5 text-amber-400" />
    if (t.includes('gold') || t.includes('crypto') || t.includes('stock') || t.includes('fund') || t.includes('equity'))
      return <Coins className="h-5 w-5 text-emerald-400" />
    if (category === 'savings') return <PiggyBank className="h-5 w-5 text-emerald-400" />
    if (category === 'debts') return <AlertCircle className="h-5 w-5 text-rose-400" />
    if (category === 'assets') return <TrendingUp className="h-5 w-5 text-cyan-400" />
    return <Zap className="h-5 w-5 text-amber-400" />
  }

  // Color theme mapping
  const getTheme = () => {
    if (category === 'savings') {
      return {
        amountColor: 'text-emerald-400',
        glowBg: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
        iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        cardBorder: 'border-slate-800/90 hover:border-emerald-500/40',
        accentGlow: 'from-emerald-500/5 to-transparent',
      }
    }
    if (category === 'debts') {
      return {
        amountColor: isHighApr ? 'text-rose-400' : 'text-rose-300',
        glowBg: isHighApr
          ? 'border-rose-500/50 shadow-rose-500/15 hover:border-rose-500/70'
          : 'hover:border-rose-500/50 hover:shadow-rose-500/10',
        iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
        badgeClass: isHighApr
          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold animate-pulse'
          : 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        cardBorder: isHighApr ? 'border-rose-500/40' : 'border-slate-800/90 hover:border-rose-500/40',
        accentGlow: 'from-rose-500/5 to-transparent',
      }
    }
    if (category === 'assets') {
      return {
        amountColor: 'text-cyan-300',
        glowBg: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10',
        iconBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        cardBorder: 'border-slate-800/90 hover:border-cyan-500/40',
        accentGlow: 'from-cyan-500/5 to-transparent',
      }
    }
    return {
      amountColor: 'text-amber-300',
      glowBg: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      cardBorder: 'border-slate-800/90 hover:border-amber-500/40',
      accentGlow: 'from-amber-500/5 to-transparent',
    }
  }

  const theme = getTheme()

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 50}ms` }}
      className={`group relative overflow-hidden rounded-2xl border ${theme.cardBorder} bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950/95 p-5 md:p-6 shadow-xl backdrop-blur-xl stage-card-lift ${theme.glowBg}`}
    >
      {/* Top subtle light accent */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${theme.accentGlow}`} />

      {/* High APR top warning stripe */}
      {isHighApr && (
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 shadow-sm" />
      )}

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left Side: Icon & Details */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-lg transition-transform duration-300 group-hover:scale-110 ${theme.iconBg}`}
          >
            {getCategoryIcon()}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-slate-100 text-base group-hover:text-white transition tracking-tight">
                {title}
              </h4>
              {badgeText && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border tracking-wide uppercase ${theme.badgeClass}`}
                >
                  {isHighApr && <ShieldAlert className="h-3 w-3 text-rose-400" />}
                  {badgeText}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Big Numeric Balance */}
        <div className="text-left sm:text-right shrink-0 bg-slate-950/40 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-slate-800/80">
          <p className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${theme.amountColor}`}>
            ₹{Math.round(amount).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mt-0.5">
            {category === 'savings' || category === 'assets' ? 'Total Asset Value' : 'Principal Balance'}
          </span>
        </div>
      </div>

      {/* Action Footer Bar with Generous Padding */}
      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-slate-800/90 pt-3.5">
        <div className="flex items-center gap-2">
          {onQuickAdjust && (category === 'savings' || category === 'debts') && (
            <button
              onClick={() => onQuickAdjust(item, category)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white border border-slate-700/80 shadow-sm active:scale-95"
            >
              {category === 'savings' ? (
                <>
                  <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Deposit Funds</span>
                </>
              ) : (
                <>
                  <MinusCircle className="h-3.5 w-3.5 text-rose-400" />
                  <span>Record Payment</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(item, category)}
            className="flex items-center gap-1 rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-primary-300 border border-transparent hover:border-slate-700"
            title="Edit Entry"
          >
            <Edit className="h-4 w-4" />
            <span className="text-xs font-medium hidden sm:inline">Edit</span>
          </button>
          <button
            onClick={() => onDelete(item.id, category)}
            className="flex items-center gap-1 rounded-xl p-2 text-slate-400 transition hover:bg-rose-950/40 hover:text-rose-400 border border-transparent hover:border-rose-800/50"
            title="Delete Entry"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-xs font-medium hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>
    </div>
  )
}
