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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative my-8 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl animate-scale-in">
        <div
          className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl opacity-20 ${
            isIncome ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-50 flex items-center gap-2">
            {editingTransaction ? 'Edit Transaction' : 'Record New Transaction'}
            <Sparkles className="h-5 w-5 text-primary-400" />
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Log financial flow events to update cash velocity and analytics
          </p>
        </div>

        {/* Type Toggle Pills */}
        <div className="mb-5 flex rounded-2xl bg-slate-800/80 p-1.5 border border-slate-700/60">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'expense' })}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-300 ${
              !isIncome
                ? 'bg-rose-500 text-slate-950 shadow-lg font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownRight className="h-4 w-4" />
            <span>Expense / Debit</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'income' })}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-300 ${
              isIncome
                ? 'bg-emerald-400 text-slate-950 shadow-lg font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Income / Credit</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mb-5 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary-400" />
            Quick Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_CATEGORIES.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className={`rounded-xl border px-3 py-1 text-xs font-semibold transition ${
                  formData.category === p.cat
                    ? 'border-primary-400 bg-primary-500/20 text-primary-300 shadow-sm'
                    : 'border-slate-700/80 bg-slate-800/70 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="uppercase tracking-wider text-[10px] font-bold text-primary-400">
              Live Preview
            </span>
            <span
              className={`font-mono text-base font-black ${
                isIncome ? 'text-emerald-400' : 'text-slate-100'
              }`}
            >
              {isIncome ? '+' : '-'}₹{Math.round(previewAmount).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-200">
              {formData.description || formData.category || 'Untitled Transaction'}
            </p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Category: {formData.category || 'General'} • Date: {formData.date}
            </p>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
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
              className="w-full rounded-2xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-sm font-mono text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Category *
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Dining, Groceries, Salary"
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Transaction Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs text-slate-100 focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Description / Notes
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Starbucks Coffee, Monthly House Rent"
              className="w-full rounded-2xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-xs font-bold text-rose-400">{error}</p>}

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 rounded-2xl px-5 py-3 text-xs font-black text-slate-950 transition flex items-center justify-center gap-2 shadow-lg ${
                isIncome
                  ? 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-500/20'
                  : 'bg-rose-400 hover:bg-rose-300 shadow-rose-500/20'
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
