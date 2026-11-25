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

import { safeNumber, formatINR } from '@/lib/formatters'

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
    amount = safeNumber(item.amount, 0)
    badgeText = 'Liquid Asset'
  } else if (category === 'debts') {
    title = item.debt_type || 'Debt / Loan'
    amount = safeNumber(item.amount, 0)
    const apr = safeNumber(item.interest_rate ?? item.rate, 0)
    if (apr > 0) {
      badgeText = `${apr}% APR`
      if (apr >= 14) isHighApr = true
    } else {
      badgeText = '0% Interest'
    }
  } else if (category === 'assets') {
    title = item.type || 'Asset'
    if (item.symbol) title += ` (${item.symbol.toUpperCase()})`
    const qty = safeNumber(item.quantity, 0)
    const prc = safeNumber(item.price, 0)
    const itemAmt = item.amount !== undefined && item.amount !== null ? safeNumber(item.amount, 0) : 0
    amount = itemAmt > 0 && qty * prc === 0 ? itemAmt : qty * prc > 0 ? qty * prc : itemAmt
    subtitle = qty > 0 && prc > 0
      ? `Qty: ${qty} × ₹${formatINR(prc)}`
      : item.description || 'Investment holding'
    if (item.purchase_date) {
      subtitle += ` • Acquired: ${new Date(item.purchase_date).toLocaleDateString('en-IN')}`
    }
  } else if (category === 'liabilities') {
    title = item.type || 'Liability'
    amount = safeNumber(item.amount, 0)
    const rateVal = safeNumber(item.rate ?? item.interest_rate, 0)
    if (rateVal > 0) badgeText = `${rateVal}% Rate`
    if (item.due_date) {
      subtitle = `Due date: ${new Date(item.due_date).toLocaleDateString('en-IN')}`
    }
  }

  // Dynamic Icon Selection
  const getCategoryIcon = () => {
    const t = (title + ' ' + (item.debt_type || '') + ' ' + (item.account_type || '')).toLowerCase()
    if (t.includes('card')) return <CreditCard className="h-5 w-5" />
    if (t.includes('home') || t.includes('mortgage') || t.includes('real estate') || t.includes('property'))
      return <Home className="h-5 w-5" />
    if (t.includes('car') || t.includes('vehicle') || t.includes('auto'))
      return <Car className="h-5 w-5" />
    if (t.includes('gold') || t.includes('crypto') || t.includes('stock') || t.includes('fund') || t.includes('equity'))
      return <Coins className="h-5 w-5" />
    if (category === 'savings') return <PiggyBank className="h-5 w-5" />
    if (category === 'debts') return <AlertCircle className="h-5 w-5" />
    if (category === 'assets') return <TrendingUp className="h-5 w-5" />
    return <Zap className="h-5 w-5" />
  }

  // Color theme mapping
  const getTheme = () => {
    if (category === 'savings') {
      return {
        amountColor: 'text-emerald-600',
        glowBg: 'hover:border-emerald-200',
        iconBg: 'icon-tile-emerald',
        badgeClass: 'badge-success',
        cardBorder: '',
        accentGlow: 'from-emerald-50/80 to-transparent',
      }
    }
    if (category === 'debts') {
      return {
        amountColor: isHighApr ? 'text-rose-700' : 'text-rose-600',
        glowBg: isHighApr
          ? 'shadow-[0_16px_36px_-24px_rgba(225,29,72,0.35)] hover:border-rose-300'
          : 'hover:border-rose-200',
        iconBg: 'icon-tile-rose',
        badgeClass: isHighApr ? 'badge-danger ring-1 ring-rose-300' : 'badge-danger',
        cardBorder: isHighApr ? 'border-rose-200' : '',
        accentGlow: 'from-rose-50/80 to-transparent',
      }
    }
    if (category === 'assets') {
      return {
        amountColor: 'text-sky-600',
        glowBg: 'hover:border-sky-200',
        iconBg: 'icon-tile-sky',
        badgeClass: 'badge-info',
        cardBorder: '',
        accentGlow: 'from-sky-50/80 to-transparent',
      }
    }
    return {
      amountColor: 'text-amber-700',
      glowBg: 'hover:border-amber-200',
      iconBg: 'icon-tile-amber',
      badgeClass: 'badge-warning',
      cardBorder: '',
      accentGlow: 'from-amber-50/80 to-transparent',
    }
  }

  const theme = getTheme()

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 50}ms` }}
      className="h-full animate-fade-up"
    >
      <div
        className={`card stage-card-lift group relative h-full overflow-hidden p-5 sm:p-6 ${theme.cardBorder} ${theme.glowBg}`}
      >
        {/* Top subtle light accent */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${theme.accentGlow}`}
        />

        {/* High APR top warning stripe */}
        {isHighApr && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500"
          />
        )}

        {/* Main Content Layout */}
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          {/* Left Side: Icon & Details */}
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className={`icon-tile icon-tile-lg ${theme.iconBg}`}>
              {getCategoryIcon()}
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="min-w-0 break-words font-display text-[15px] font-semibold tracking-tight text-ink-900 transition-colors group-hover:text-ink-950 sm:text-base">
                  {title}
                </h4>
                {badgeText && (
                  <span className={`badge num uppercase tracking-wide ${theme.badgeClass}`}>
                    {isHighApr && <ShieldAlert className="h-3 w-3" />}
                    {badgeText}
                  </span>
                )}
              </div>

              <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right Side: Big Numeric Balance */}
          <div className="surface-inset shrink-0 p-3 text-left sm:border-0 sm:bg-transparent sm:p-0 sm:text-right">
            <p className={`kpi-value break-words text-xl sm:text-2xl ${theme.amountColor}`}>
              ₹{formatINR(amount)}
            </p>
            <span className="eyebrow mt-1 block text-[10px] text-slate-500">
              {category === 'savings' || category === 'assets' ? 'Total Asset Value' : 'Principal Balance'}
            </span>
          </div>
        </div>

        {/* Action Footer Bar with Generous Padding */}
        <div className="relative z-10 mt-5 flex items-center justify-between gap-2 border-t border-line pt-4">
          <div className="flex items-center gap-2">
            {onQuickAdjust && (category === 'savings' || category === 'debts') && (
              <button
                onClick={() => onQuickAdjust(item, category)}
                className="btn-secondary btn-sm h-9 px-3"
              >
                {category === 'savings' ? (
                  <>
                    <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Deposit Funds</span>
                  </>
                ) : (
                  <>
                    <MinusCircle className="h-3.5 w-3.5 text-rose-600" />
                    <span>Record Payment</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(item, category)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-transparent px-2.5 text-slate-500 transition-colors hover:border-primary-100 hover:bg-primary-50 hover:text-primary-700"
              title="Edit Entry"
              aria-label="Edit Entry"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden text-xs font-medium sm:inline">Edit</span>
            </button>
            <button
              onClick={() => onDelete(item.id, category)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-transparent px-2.5 text-slate-500 transition-colors hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
              title="Delete Entry"
              aria-label="Delete Entry"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden text-xs font-medium sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
