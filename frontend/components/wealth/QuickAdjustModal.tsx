'use client'

import { useState } from 'react'
import { X, Sparkles, PlusCircle, MinusCircle, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { WealthItem, WealthCategory } from './WealthItemCard'

interface QuickAdjustModalProps {
  item: WealthItem | null
  category: WealthCategory
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function QuickAdjustModal({
  item,
  category,
  isOpen,
  onClose,
  onSuccess,
}: QuickAdjustModalProps) {
  const [amountInput, setAmountInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !item) return null

  const isSaving = category === 'savings'
  const currentAmount = item.amount || 0
  const title = isSaving ? (item.account_type || 'Savings') : (item.debt_type || 'Debt')
  const adjustValue = parseFloat(amountInput) || 0

  const previewNewAmount = isSaving
    ? currentAmount + adjustValue
    : Math.max(0, currentAmount - adjustValue)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustValue || adjustValue <= 0) {
      setError('Please enter a valid positive amount')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      if (isSaving) {
        const newTotal = currentAmount + adjustValue
        await api.put(`/savings/${item.id}`, {
          amount: newTotal,
          account_type: item.account_type || 'Savings Account',
          description: item.description || '',
        })
      } else {
        const newTotal = Math.max(0, currentAmount - adjustValue)
        await api.put(`/debts/${item.id}`, {
          amount: newTotal,
          interest_rate: item.interest_rate || 0,
          debt_type: item.debt_type || 'Loan',
          description: item.description || '',
        })
      }

      onSuccess()
      onClose()
      setAmountInput('')
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || 'Failed to update balance')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl animate-scale-in">
        {/* Ambient glow */}
        <div
          className={`pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full blur-3xl opacity-25 ${
            isSaving ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              isSaving
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {isSaving ? <PlusCircle className="h-5 w-5" /> : <MinusCircle className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              {isSaving ? 'Deposit to Savings' : 'Record Debt Paydown'}
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-[260px]">{title}</p>
          </div>
        </div>

        {/* Live Calculation Preview Card */}
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Current Balance:</span>
            <span className="font-mono text-slate-200">₹{Math.round(currentAmount).toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isSaving ? 'Deposit Amount:' : 'Payment Applied:'}</span>
            <span className={`font-mono font-semibold ${isSaving ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isSaving ? '+' : '-'}₹{Math.round(adjustValue).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300">Updated Balance:</span>
            <span className="font-mono text-sm text-slate-50">
              ₹{Math.round(previewNewAmount).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Enter Amount (₹)
            </label>
            <input
              type="number"
              step="100"
              min="1"
              required
              autoFocus
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {[1000, 2500, 5000, 10000, 25000].map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => setAmountInput(preset.toString())}
                className="rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs font-mono font-medium text-slate-300 hover:border-primary-500 hover:text-white transition"
              >
                +₹{preset.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 rounded-xl px-4 py-2 text-xs font-bold text-slate-950 transition flex items-center justify-center gap-1.5 ${
                isSaving
                  ? 'bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20'
                  : 'bg-rose-400 hover:bg-rose-300 shadow-lg shadow-rose-500/20'
              }`}
            >
              {submitting ? 'Applying...' : isSaving ? 'Confirm Deposit' : 'Confirm Paydown'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
