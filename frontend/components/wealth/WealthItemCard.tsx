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
  Sparkles
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
  let subtitle = item.description || 'No description'
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
      subtitle += ` • Bought: ${new Date(item.purchase_date).toLocaleDateString('en-IN')}`
    }
  } else if (category === 'liabilities') {
    title = item.type || 'Liability'
    amount = item.amount || 0
    if (item.rate) badgeText = `${item.rate}% Rate`
    if (item.due_date) {
      subtitle = `Due: ${new Date(item.due_date).toLocaleDateString('en-IN')}`
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
        glowBg: 'hover:border-emerald-500/40 hover:shadow-emerald-500/5',
        iconBg: 'bg-emerald-500/10 border-emerald-500/20',
        badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      }
    }
    if (category === 'debts') {
      return {
        amountColor: isHighApr ? 'text-rose-400' : 'text-rose-300',
        glowBg: isHighApr
          ? 'border-rose-500/40 shadow-rose-500/10 hover:border-rose-500/60'
          : 'hover:border-rose-500/40 hover:shadow-rose-500/5',
        iconBg: 'bg-rose-500/10 border-rose-500/20',
        badgeClass: isHighApr
          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
          : 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      }
    }
    if (category === 'assets') {
      return {
        amountColor: 'text-cyan-300',
        glowBg: 'hover:border-cyan-500/40 hover:shadow-cyan-500/5',
        iconBg: 'bg-cyan-500/10 border-cyan-500/20',
        badgeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      }
    }
    return {
      amountColor: 'text-amber-300',
      glowBg: 'hover:border-amber-500/40 hover:shadow-amber-500/5',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    }
  }

  const theme = getTheme()

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 60}ms` }}
      className={`group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 p-4.5 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-fade-up ${theme.glowBg}`}
    >
      {/* High APR top warning bar */}
      {isHighApr && (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Left icon & details */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105 shadow-inner ${theme.iconBg}`}
          >
            {getCategoryIcon()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-slate-100 text-sm sm:text-base truncate group-hover:text-white transition">
                {title}
              </h4>
              {badgeText && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border tracking-wide uppercase ${theme.badgeClass}`}
                >
                  {isHighApr && <ShieldAlert className="h-3 w-3 text-rose-400 animate-pulse" />}
                  {badgeText}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1 line-clamp-1 leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right Balance & Quick Actions */}
        <div className="text-right shrink-0">
          <p className={`text-base sm:text-lg font-bold font-mono tracking-tight ${theme.amountColor}`}>
            ₹{Math.round(amount).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            {category === 'savings' || category === 'assets' ? 'Asset Value' : 'Outstanding Balance'}
          </span>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
        <div className="flex items-center gap-2">
          {onQuickAdjust && (category === 'savings' || category === 'debts') && (
            <button
              onClick={() => onQuickAdjust(item, category)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white border border-slate-700/60"
            >
              {category === 'savings' ? (
                <>
                  <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
                  Quick Deposit
                </>
              ) : (
                <>
                  <MinusCircle className="h-3.5 w-3.5 text-rose-400" />
                  Record Paydown
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(item, category)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-primary-300 border border-transparent hover:border-slate-700"
            title="Edit Item"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(item.id, category)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-950/40 hover:text-rose-400 border border-transparent hover:border-rose-800/50"
            title="Delete Item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
