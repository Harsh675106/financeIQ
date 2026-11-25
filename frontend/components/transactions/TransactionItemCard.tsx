'use client'

import { useState } from 'react'
import {
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Utensils,
  Home,
  Car,
  Zap,
  Laptop,
  HeartPulse,
  Plane,
  Briefcase,
  Coins,
  Repeat,
  Tag,
  Copy,
  Clock,
  Sparkles,
  Check
} from 'lucide-react'

export interface TransactionItem {
  id: number
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}

interface TransactionItemCardProps {
  transaction: TransactionItem
  index: number
  onEdit: (transaction: TransactionItem) => void
  onDelete: (id: number) => void
  onDuplicate?: (transaction: TransactionItem) => void
}

export default function TransactionItemCard({
  transaction,
  index,
  onEdit,
  onDelete,
  onDuplicate,
}: TransactionItemCardProps) {
  const [copied, setCopied] = useState(false)
  const isIncome = transaction.type === 'income'

  // Dynamic Category Icon Selection (each category gets its own light tile tone)
  const getCategoryIcon = () => {
    const cat = (transaction.category + ' ' + transaction.description).toLowerCase()
    if (cat.includes('food') || cat.includes('dining') || cat.includes('restaurant') || cat.includes('cafe') || cat.includes('swiggy') || cat.includes('zomato'))
      return (
        <span className="icon-tile bg-none bg-orange-50 text-orange-600 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.22)]">
          <Utensils className="h-[18px] w-[18px]" />
        </span>
      )
    if (cat.includes('shop') || cat.includes('cloth') || cat.includes('amazon') || cat.includes('flipkart') || cat.includes('myntra'))
      return (
        <span className="icon-tile bg-none bg-fuchsia-50 text-fuchsia-600 shadow-[inset_0_0_0_1px_rgba(217,70,239,0.2)]">
          <ShoppingBag className="h-[18px] w-[18px]" />
        </span>
      )
    if (cat.includes('rent') || cat.includes('home') || cat.includes('house') || cat.includes('mortgage'))
      return (
        <span className="icon-tile icon-tile-violet">
          <Home className="h-[18px] w-[18px]" />
        </span>
      )
    if (cat.includes('car') || cat.includes('fuel') || cat.includes('petrol') || cat.includes('uber') || cat.includes('ola') || cat.includes('travel') || cat.includes('flight'))
      return (
        <span className="icon-tile icon-tile-sky">
          <Car className="h-[18px] w-[18px]" />
        </span>
      )
    if (cat.includes('tech') || cat.includes('software') || cat.includes('subscription') || cat.includes('netflix') || cat.includes('spotify') || cat.includes('aws'))
      return (
        <span className="icon-tile icon-tile-cyan">
          <Laptop className="h-[18px] w-[18px]" />
        </span>
      )
    if (cat.includes('health') || cat.includes('doctor') || cat.includes('med') || cat.includes('pharma') || cat.includes('gym'))
      return (
        <span className="icon-tile icon-tile-rose">
          <HeartPulse className="h-[18px] w-[18px]" />
        </span>
      )
    if (cat.includes('util') || cat.includes('bill') || cat.includes('electric') || cat.includes('wifi'))
      return (
        <span className="icon-tile icon-tile-amber">
          <Zap className="h-[18px] w-[18px]" />
        </span>
      )
    if (cat.includes('salary') || cat.includes('pay') || cat.includes('freelance') || cat.includes('bonus') || cat.includes('dividend'))
      return (
        <span className="icon-tile icon-tile-emerald">
          <Briefcase className="h-[18px] w-[18px]" />
        </span>
      )
    if (isIncome)
      return (
        <span className="icon-tile icon-tile-emerald">
          <Coins className="h-[18px] w-[18px]" />
        </span>
      )
    return (
      <span className="icon-tile icon-tile-slate">
        <Tag className="h-[18px] w-[18px]" />
      </span>
    )
  }

  // Format Date human-friendly
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24))
      
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`₹${transaction.amount} - ${transaction.category} (${transaction.description})`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{ animationDelay: `${index * 40}ms` }}
      className="group surface-inset surface-inset-hover relative overflow-hidden p-3.5 animate-fade-up sm:p-4"
    >
      {/* Semantic accent rail */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-r-full ${
          isIncome ? 'bg-emerald-500' : 'bg-rose-400'
        }`}
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 sm:flex-nowrap sm:gap-4">
        {/* Category icon tile */}
        {getCategoryIcon()}

        {/* Description, category & meta */}
        <div className="min-w-0 flex-1 basis-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h4 className="min-w-0 max-w-full truncate text-sm font-semibold tracking-tight text-ink-900 sm:text-[15px]">
              {transaction.description || transaction.category || 'Transaction'}
            </h4>

            {transaction.category && (
              <span className="badge badge-neutral max-w-full truncate text-[10px] uppercase tracking-wider">
                {transaction.category}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="h-3 w-3 text-slate-400" />
              {formatDate(transaction.date)}
            </span>
            <span className="text-slate-400" aria-hidden="true">•</span>
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-medium capitalize ${
                isIncome ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {isIncome ? (
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
              )}
              {transaction.type}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="shrink-0 text-right">
          <p
            className={`num font-display text-base font-semibold tracking-tight sm:text-lg ${
              isIncome ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {isIncome ? '+' : '-'}₹{Number(transaction.amount).toLocaleString('en-IN')}
          </p>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isIncome ? 'Inflow Credited' : 'Debited'}
          </span>
        </div>

        {/* Action Icons */}
        <div className="flex w-full items-center justify-end gap-1.5 border-t border-line pt-2.5 transition-opacity sm:w-auto sm:shrink-0 sm:border-t-0 sm:pt-0 sm:opacity-60 sm:focus-within:opacity-100 sm:group-hover:opacity-100">
          <button
            onClick={handleCopy}
            className="btn-icon sm:h-8 sm:w-8 sm:rounded-lg"
            title="Copy details"
            aria-label="Copy details"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => onEdit(transaction)}
            className="btn-icon hover:!border-primary-200 hover:!bg-primary-50 hover:!text-primary-700 sm:h-8 sm:w-8 sm:rounded-lg"
            title="Edit Transaction"
            aria-label="Edit transaction"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="btn-icon hover:!border-rose-200 hover:!bg-rose-50 hover:!text-rose-600 sm:h-8 sm:w-8 sm:rounded-lg"
            title="Delete Transaction"
            aria-label="Delete transaction"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
