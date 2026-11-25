'use client'

import { useState } from 'react'
import { X, Sparkles, PlusCircle, MinusCircle, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { safeNumber, formatINR } from '@/lib/formatters'
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
  const currentAmount = safeNumber(item.amount, 0)
  const title = isSaving ? (item.account_type || 'Savings') : (item.debt_type || 'Debt')
  const adjustValue = Math.max(0, safeNumber(amountInput, 0))

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
    <div className="modal-backdrop animate-fade-in">
      <div className="modal-panel max-w-md overflow-y-auto p-5 animate-scale-in sm:p-6">
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-3xl ${
            isSaving ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />

        {/* Mobile sheet handle */}
        <div aria-hidden="true" className="relative mx-auto -mt-1 mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="btn-icon absolute right-4 top-4 z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <div className="relative mb-5 flex items-center gap-3 pr-12">
          <span className={`icon-tile ${isSaving ? 'icon-tile-emerald' : 'icon-tile-rose'}`}>
            {isSaving ? <PlusCircle className="h-5 w-5" /> : <MinusCircle className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold tracking-tight text-slate-50 sm:text-lg">
              {isSaving ? 'Deposit to Savings' : 'Record Debt Paydown'}
            </h3>
            <p className="truncate text-xs text-slate-400">{title}</p>
          </div>
        </div>

        {/* Live Calculation Preview Card */}
        <div className="surface-inset relative mb-5 space-y-2.5 p-4">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
            <span>Current Balance:</span>
            <span className="num font-medium text-slate-200">₹{formatINR(currentAmount)}</span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
            <span>{isSaving ? 'Deposit Amount:' : 'Payment Applied:'}</span>
            <span className={`num font-semibold ${isSaving ? 'text-emerald-300' : 'text-rose-300'}`}>
              {isSaving ? '+' : '-'}₹{formatINR(adjustValue)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-2.5 text-xs font-semibold">
            <span className="text-slate-300">Updated Balance:</span>
            <span className="kpi-value text-base">
              ₹{formatINR(previewNewAmount)}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative space-y-4">
          <div>
            <label className="label">
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
              className="input num"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {[1000, 2500, 5000, 10000, 25000].map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => setAmountInput(preset.toString())}
                className="num rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-primary-400/45 hover:bg-primary-500/10 hover:text-white"
              >
                +₹{preset.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
            >
              {error}
            </p>
          )}

          <div className="flex gap-3 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary h-11 flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`btn h-11 flex-1 text-white ${
                isSaving
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_24px_-10px_rgba(16,185,129,0.75)] hover:brightness-110'
                  : 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_24px_-10px_rgba(244,63,94,0.75)] hover:brightness-110'
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
