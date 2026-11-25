'use client'

import { useState, useEffect } from 'react'
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Coins,
  CheckCircle2,
  Calendar,
  Tag,
  DollarSign
} from 'lucide-react'
import { api } from '@/lib/api'
import { TransactionItem } from './TransactionItemCard'

interface TransactionModalProps {
  isOpen: boolean
  editingTransaction: TransactionItem | null
  onClose: () => void
  onSuccess: () => void
}

const PRESET_CATEGORIES = [
  { label: 'Salary / Income', type: 'income', cat: 'Salary' },
  { label: 'Freelance', type: 'income', cat: 'Freelance' },
  { label: 'Dining & Food', type: 'expense', cat: 'Dining' },
  { label: 'Groceries', type: 'expense', cat: 'Groceries' },
  { label: 'House Rent', type: 'expense', cat: 'Rent' },
  { label: 'Shopping', type: 'expense', cat: 'Shopping' },
  { label: 'Tech / SaaS', type: 'expense', cat: 'Technology' },
  { label: 'Fuel / Travel', type: 'expense', cat: 'Travel' },
  { label: 'Utilities & Bills', type: 'expense', cat: 'Utilities' },
]

export default function TransactionModal({
  isOpen,
  editingTransaction,
  onClose,
  onSuccess,
}: TransactionModalProps) {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        type: editingTransaction.type,
        amount: editingTransaction.amount.toString(),
        category: editingTransaction.category || '',
        description: editingTransaction.description || '',
        date: editingTransaction.date.split('T')[0],
      })
    } else {
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      })
    }
  }, [editingTransaction, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const payload = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category || 'General',
        description: formData.description || formData.category,
        date: formData.date,
      }

      if (editingTransaction) {
        await api.put(`/transactions/${editingTransaction.id}`, payload)
      } else {
        await api.post('/transactions', payload)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || 'Failed to save transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const applyPreset = (preset: typeof PRESET_CATEGORIES[0]) => {
    setFormData((prev) => ({
      ...prev,
      type: preset.type as 'income' | 'expense',
      category: preset.cat,
      description: prev.description || preset.label,
    }))
  }

  const isIncome = formData.type === 'income'
  const previewAmount = parseFloat(formData.amount) || 0

  return (
    <div className="modal-backdrop animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
        className="modal-panel max-w-lg overflow-y-auto p-5 animate-scale-in sm:p-7"
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl opacity-20 ${
            isIncome ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />

        {/* Mobile sheet handle */}
        <div aria-hidden="true" className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="btn-icon absolute right-4 top-4 z-10 sm:right-5 sm:top-5"
          aria-label="Close"
        >
          <X className="h-[18px] w-[18px]" />
        </button>

        {/* Header */}
        <div className="relative mb-6 flex items-start gap-3 pr-12">
          <span className="icon-tile">
            <Sparkles className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h2
              id="transaction-modal-title"
              className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl"
            >
              {editingTransaction ? 'Edit Transaction' : 'Record New Transaction'}
            </h2>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Log financial flow events to update cash velocity and analytics
            </p>
          </div>
        </div>

        {/* Type Toggle Pills */}
        <div className="segmented relative mb-5 flex w-full">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'expense' })}
            aria-pressed={!isIncome}
            className={`segmented-item flex-1 py-2.5 text-[13px] ${
              !isIncome
                ? 'bg-rose-500/15 !text-rose-200 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.35),0_4px_14px_-6px_rgba(244,63,94,0.6)]'
                : ''
            }`}
          >
            <ArrowDownRight className="h-4 w-4" />
            <span>Expense / Debit</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'income' })}
            aria-pressed={isIncome}
            className={`segmented-item flex-1 py-2.5 text-[13px] ${
              isIncome
                ? 'bg-emerald-500/15 !text-emerald-200 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.35),0_4px_14px_-6px_rgba(16,185,129,0.6)]'
                : ''
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Income / Credit</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="relative mb-5 space-y-2">
          <span className="eyebrow flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary-300" />
            Quick Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_CATEGORIES.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                aria-pressed={formData.category === p.cat}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  formData.category === p.cat
                    ? 'border-primary-400/50 bg-primary-500/15 text-primary-100 shadow-[0_4px_14px_-8px_rgba(112,104,244,0.8)]'
                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="surface-inset relative mb-6 p-4">
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-300">
              Live Preview
            </span>
            <span
              className={`num truncate font-display text-base font-semibold sm:text-lg ${
                isIncome ? 'text-emerald-400' : 'text-slate-100'
              }`}
            >
              {isIncome ? '+' : '-'}₹{Math.round(previewAmount).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="min-w-0 text-xs">
            <p className="truncate text-sm font-semibold text-slate-100">
              {formData.description || formData.category || 'Untitled Transaction'}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              Category: {formData.category || 'General'} • Date: {formData.date}
            </p>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="relative space-y-4">
          <div>
            <label className="label">
              Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              autoFocus
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="input num font-display text-base font-semibold sm:text-lg"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">
                Category *
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Dining, Groceries, Salary"
                className="input"
              />
            </div>

            <div>
              <label className="label">
                Transaction Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">
              Description / Notes
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Starbucks Coffee, Monthly House Rent"
              className="input"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300"
            >
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2 pb-[env(safe-area-inset-bottom)]">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`btn flex-1 py-3 hover:brightness-110 ${
                isIncome
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 shadow-[0_8px_24px_-10px_rgba(16,185,129,0.75)]'
                  : 'bg-gradient-to-r from-rose-500 to-pink-400 text-white shadow-[0_8px_24px_-10px_rgba(244,63,94,0.75)]'
              }`}
            >
              {submitting ? 'Recording...' : editingTransaction ? 'Update Entry' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
