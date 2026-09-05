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

  // Dynamic Category Icon Selection
  const getCategoryIcon = () => {
    const cat = (transaction.category + ' ' + transaction.description).toLowerCase()
    if (cat.includes('food') || cat.includes('dining') || cat.includes('restaurant') || cat.includes('cafe') || cat.includes('swiggy') || cat.includes('zomato'))
      return <Utensils className="h-4.5 w-4.5 text-amber-400" />
    if (cat.includes('shop') || cat.includes('cloth') || cat.includes('amazon') || cat.includes('flipkart') || cat.includes('myntra'))
      return <ShoppingBag className="h-4.5 w-4.5 text-purple-400" />
    if (cat.includes('rent') || cat.includes('home') || cat.includes('house') || cat.includes('mortgage'))
      return <Home className="h-4.5 w-4.5 text-indigo-400" />
    if (cat.includes('car') || cat.includes('fuel') || cat.includes('petrol') || cat.includes('uber') || cat.includes('ola') || cat.includes('travel') || cat.includes('flight'))
      return <Car className="h-4.5 w-4.5 text-blue-400" />
    if (cat.includes('tech') || cat.includes('software') || cat.includes('subscription') || cat.includes('netflix') || cat.includes('spotify') || cat.includes('aws'))
      return <Laptop className="h-4.5 w-4.5 text-cyan-400" />
    if (cat.includes('health') || cat.includes('doctor') || cat.includes('med') || cat.includes('pharma') || cat.includes('gym'))
      return <HeartPulse className="h-4.5 w-4.5 text-rose-400" />
    if (cat.includes('util') || cat.includes('bill') || cat.includes('electric') || cat.includes('wifi'))
      return <Zap className="h-4.5 w-4.5 text-yellow-400" />
    if (cat.includes('salary') || cat.includes('pay') || cat.includes('freelance') || cat.includes('bonus') || cat.includes('dividend'))
      return <Briefcase className="h-4.5 w-4.5 text-emerald-400" />
    if (isIncome) return <Coins className="h-4.5 w-4.5 text-emerald-400" />
    return <Tag className="h-4.5 w-4.5 text-slate-400" />
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
      className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-4.5 shadow-lg backdrop-blur-xl transition-all duration-300 stage-card-lift animate-fade-up ${
        isIncome
          ? 'border-emerald-500/20 bg-gradient-to-r from-emerald-950/25 via-slate-900/90 to-slate-950/95 hover:border-emerald-500/50 hover:shadow-emerald-500/5'
          : 'border-slate-800/90 bg-gradient-to-r from-slate-900/95 via-slate-900/85 to-slate-950/95 hover:border-rose-500/40 hover:shadow-rose-500/5'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Left Icon & Information */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-md transition-transform duration-300 group-hover:scale-110 ${
              isIncome
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300'
            }`}
          >
            {getCategoryIcon()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-slate-100 text-sm sm:text-base truncate group-hover:text-white transition tracking-tight">
                {transaction.description || transaction.category || 'Transaction'}
              </h4>

              {transaction.category && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700 uppercase tracking-wider">
                  {transaction.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-400">
                <Clock className="h-3 w-3 text-slate-500" />
                {formatDate(transaction.date)}
              </span>
              <span>•</span>
              <span className="capitalize text-slate-400 font-mono text-[11px]">{transaction.type}</span>
            </div>
          </div>
        </div>

        {/* Right Amount & Quick Actions Tray */}
        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-slate-800/70 pt-2 sm:pt-0">
          <div className="text-left sm:text-right">
            <p
              className={`text-lg sm:text-xl font-black font-mono tracking-tight ${
                isIncome ? 'text-emerald-400' : 'text-slate-100'
              }`}
            >
              {isIncome ? '+' : '-'}₹{Number(transaction.amount).toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              {isIncome ? 'Inflow Credited' : 'Debited'}
            </span>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 opacity-90 sm:opacity-75 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Copy details"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => onEdit(transaction)}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-primary-300 transition"
              title="Edit Transaction"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(transaction.id)}
              className="rounded-xl p-2 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition"
              title="Delete Transaction"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
