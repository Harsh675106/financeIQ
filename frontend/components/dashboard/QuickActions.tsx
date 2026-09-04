'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Target,
  BrainCircuit,
  AlertCircle,
  ArrowRight,
  X,
  Sparkles,
  Check,
  TrendingUp,
} from 'lucide-react'
import { api } from '@/lib/api'

export default function QuickActions() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [txType, setTxType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successToast, setSuccessToast] = useState(false)

  const actions = [
    {
      icon: Plus,
      label: 'Add Transaction',
      description: 'Quick log income or expense',
      color: 'from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600',
      shortcut: 'T',
      onClick: () => setModalOpen(true),
    },
    {
      icon: Target,
      label: 'Create Goal',
      description: 'Define target & timeline',
      color: 'from-primary-600 to-emerald-700 hover:from-primary-500 hover:to-emerald-600',
      shortcut: 'G',
      onClick: () => router.push('/dashboard/goals'),
    },
    {
      icon: BrainCircuit,
      label: 'AI Copilot Chat',
      description: 'Ask deep financial questions',
      color: 'from-cyan-600 to-sky-700 hover:from-cyan-500 hover:to-sky-600',
      shortcut: 'C',
      onClick: () => router.push('/dashboard/chat'),
    },
    {
      icon: AlertCircle,
      label: 'Risk Warnings',
      description: 'Review stress probabilities',
      color: 'from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600',
      shortcut: 'A',
      onClick: () => router.push('/dashboard/alerts'),
    },
  ]

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description) return
    setSubmitting(true)
    try {
      await api.post('/transactions', {
        type: txType,
        amount: parseFloat(amount),
        category: category || (txType === 'income' ? 'Salary' : 'General'),
        description,
        date: new Date().toISOString().split('T')[0],
      })
      setModalOpen(false)
      setAmount('')
      setDescription('')
      setCategory('')
      setSuccessToast(true)
      setTimeout(() => setSuccessToast(false), 3500)
    } catch (err) {
      console.error('Failed to log quick transaction', err)
      // Fallback navigate to transaction page
      router.push('/dashboard/transactions')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="card card-pad card-spotlight group animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 icon-morph-container">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-50">Instant Actions</h2>
              <p className="text-xs text-slate-400">Rapid workflow launchers</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`quick-action-card group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.color} p-3.5 sm:p-4 text-left text-white shadow-lg backdrop-blur-xl animate-fade-up`}
                style={{ animationDelay: `${50 + index * 40}ms` }}
              >
                {/* Background Shimmer Layer */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-50 transition-opacity group-hover:opacity-80" />

                {/* Top Row: Icon and Shortcut */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/20 backdrop-blur-md">
                    <Icon className="action-icon h-4 w-4 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="hidden sm:inline-block rounded-md bg-black/25 px-1.5 py-0.5 text-[10px] font-mono text-white/80">
                      {action.shortcut}
                    </span>
                    <ArrowRight className="action-arrow h-4 w-4 text-white/90" />
                  </div>
                </div>

                {/* Text Content */}
                <p className="text-xs sm:text-sm font-bold tracking-tight text-white leading-tight">
                  {action.label}
                </p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] text-white/80 line-clamp-1">
                  {action.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="fixed bottom-6 left-6 z-[200] animate-pop-in rounded-xl border border-emerald-500/30 bg-slate-900/95 px-4 py-3 text-xs font-medium text-slate-100 shadow-2xl backdrop-blur-xl flex items-center gap-2.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Check className="h-3.5 w-3.5" />
          </div>
          <span>Transaction recorded instantly!</span>
        </div>
      )}

      {/* Fast Transaction Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl animate-pop-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-50">Quick Log Transaction</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950/80 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    txType === 'expense'
                      ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    txType === 'income'
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Income
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 2500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input text-sm"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grocery shopping / Freelance work"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-ghost text-xs px-3 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  {submitting ? 'Saving...' : 'Save Instant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
