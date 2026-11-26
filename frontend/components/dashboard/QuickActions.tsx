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
  Check,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { api } from '@/lib/api'
import SectionHeader from '@/components/ui/SectionHeader'
import Portal from '@/components/ui/Portal'
import TiltCard from '@/components/motion/TiltCard'

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
      color: 'icon-tile-brand',
      glow: 'bg-primary-200/70',
      shortcut: 'T',
      onClick: () => setModalOpen(true),
    },
    {
      icon: Target,
      label: 'Create Goal',
      description: 'Define target & timeline',
      color: 'icon-tile-sky',
      glow: 'bg-ice-200/70',
      shortcut: 'G',
      onClick: () => router.push('/dashboard/goals'),
    },
    {
      icon: BrainCircuit,
      label: 'AI Copilot Chat',
      description: 'Ask deep financial questions',
      color: 'icon-tile-violet',
      glow: 'bg-indigo-200/70',
      shortcut: 'C',
      onClick: () => router.push('/dashboard/chat'),
    },
    {
      icon: AlertCircle,
      label: 'Risk Warnings',
      description: 'Review stress probabilities',
      color: 'icon-tile-rose',
      glow: 'bg-rose-200/70',
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
      <div className="card card-pad card-spotlight group flex flex-col animate-fade-up">
        <SectionHeader
          icon={Zap}
          tone="brand"
          title="Instant Actions"
          subtitle="Rapid workflow launchers"
          className="relative mb-5"
        />

        <div className="relative grid flex-1 auto-rows-fr grid-cols-2 gap-3 sm:gap-3.5">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              // Entrance animation sits on the wrapper so it can't fight the 3D tilt.
              <div
                key={index}
                className="h-full animate-fade-up"
                style={{ animationDelay: `${50 + index * 40}ms` }}
              >
              <TiltCard className="h-full" max={9} lift={8}>
              <button
                onClick={action.onClick}
                className="quick-action-card group/action relative flex h-full min-h-[7.5rem] w-full flex-col justify-between overflow-hidden rounded-2xl border border-line bg-canvas p-3.5 text-left transition-colors hover:border-primary-200 hover:bg-white hover:shadow-card-hover sm:p-4"
              >
                {/* Hover accent glow */}
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${action.glow} opacity-0 blur-2xl transition-opacity duration-300 group-hover/action:opacity-100`}
                />

                {/* Top Row: Icon and Shortcut */}
                <div className="relative mb-3 flex items-center justify-between">
                  <span className={`action-icon icon-tile icon-tile-sm ${action.color}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <kbd className="hidden rounded-md border border-line bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500 shadow-xs sm:inline-block">
                      {action.shortcut}
                    </kbd>
                    <ArrowRight className="action-arrow h-4 w-4 text-primary-600" aria-hidden="true" />
                  </div>
                </div>

                {/* Text Content */}
                <div className="relative">
                  <p className="font-display text-xs font-semibold leading-tight tracking-tight text-ink-900 sm:text-sm">
                    {action.label}
                  </p>
                  <p className="mt-1 line-clamp-1 text-[10px] text-slate-500 sm:text-[11px]">
                    {action.description}
                  </p>
                </div>
              </button>
              </TiltCard>
              </div>
            )
          })}
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <Portal>
        <div
          role="status"
          className="glass-strong fixed bottom-6 right-4 z-[200] flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-medium text-ink-900 animate-pop-in sm:right-6"
        >
          <span className="icon-tile icon-tile-sm icon-tile-emerald h-6 w-6 rounded-md">
            <Check className="h-3.5 w-3.5" />
          </span>
          <span>Transaction recorded instantly!</span>
        </div>
        </Portal>
      )}

      {/* Fast Transaction Modal */}
      {modalOpen && (
        <Portal>
        <div className="modal-backdrop animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-log-title"
            className="modal-panel max-w-md overflow-y-auto p-5 animate-pop-in sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="icon-tile icon-tile-sm icon-tile-brand">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <h3 id="quick-log-title" className="truncate font-display text-base font-semibold text-ink-900">
                  Quick Log Transaction
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="btn-icon"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="segmented grid w-full grid-cols-2" role="group" aria-label="Transaction type">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  aria-pressed={txType === 'expense'}
                  className={`segmented-item py-2 ${
                    txType === 'expense'
                      ? 'bg-white !text-rose-700 shadow-xs ring-1 ring-inset ring-rose-200'
                      : ''
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  aria-pressed={txType === 'income'}
                  className={`segmented-item py-2 ${
                    txType === 'income'
                      ? 'bg-white !text-emerald-700 shadow-xs ring-1 ring-inset ring-emerald-200'
                      : ''
                  }`}
                >
                  Income
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="label">Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 2500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input num"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grocery shopping / Freelance work"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-ghost w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full sm:w-auto"
                >
                  {submitting ? 'Saving...' : 'Save Instant'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </Portal>
      )}
    </>
  )
}
