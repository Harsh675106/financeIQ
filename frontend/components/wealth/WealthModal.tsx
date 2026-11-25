'use client'

import { useState, useEffect } from 'react'
import {
  X,
  PiggyBank,
  AlertCircle,
  TrendingUp,
  Zap,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Coins
} from 'lucide-react'
import { api } from '@/lib/api'
import { safeNumber, formatINR } from '@/lib/formatters'
import { WealthCategory, WealthItem } from './WealthItemCard'

// Literal class map so Tailwind keeps every tone (savings/assets read positive, debts as liabilities).
const previewToneClass: Record<WealthCategory, string> = {
  savings: 'text-emerald-700',
  debts: 'text-rose-600',
  assets: 'text-sky-700',
  liabilities: 'text-amber-700',
}

interface WealthModalProps {
  isOpen: boolean
  initialCategory: WealthCategory
  editingItem: WealthItem | null
  onClose: () => void
  onSuccess: () => void
}

export default function WealthModal({
  isOpen,
  initialCategory,
  editingItem,
  onClose,
  onSuccess,
}: WealthModalProps) {
  const [activeTab, setActiveTab] = useState<WealthCategory>(initialCategory)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    amount: '',
    account_type: '',
    description: '',
    interest_rate: '',
    debt_type: '',
    type: '',
    quantity: '',
    price: '',
    symbol: '',
    purchase_date: '',
    rate: '',
    due_date: '',
  })

  useEffect(() => {
    if (initialCategory) {
      setActiveTab(initialCategory)
    }
  }, [initialCategory])

  useEffect(() => {
    if (editingItem) {
      if (activeTab === 'savings' && 'account_type' in editingItem) {
        setFormData({
          amount: (editingItem.amount || '').toString(),
          account_type: editingItem.account_type || '',
          description: editingItem.description || '',
          interest_rate: '',
          debt_type: '',
          type: '',
          quantity: '',
          price: '',
          symbol: '',
          purchase_date: '',
          rate: '',
          due_date: '',
        })
      } else if (activeTab === 'debts' && 'debt_type' in editingItem) {
        setFormData({
          amount: (editingItem.amount || '').toString(),
          account_type: '',
          description: editingItem.description || '',
          interest_rate: (editingItem.interest_rate || '').toString(),
          debt_type: editingItem.debt_type || '',
          type: '',
          quantity: '',
          price: '',
          symbol: '',
          purchase_date: '',
          rate: '',
          due_date: '',
        })
      } else if (activeTab === 'assets' && 'quantity' in editingItem) {
        setFormData({
          amount: '',
          account_type: '',
          description: '',
          interest_rate: '',
          debt_type: '',
          type: editingItem.type || '',
          quantity: (editingItem.quantity || '').toString(),
          price: (editingItem.price || '').toString(),
          symbol: editingItem.symbol || '',
          purchase_date: editingItem.purchase_date ? editingItem.purchase_date.split('T')[0] : '',
          rate: '',
          due_date: '',
        })
      } else if (activeTab === 'liabilities') {
        setFormData({
          amount: (editingItem.amount || '').toString(),
          account_type: '',
          description: '',
          interest_rate: '',
          debt_type: '',
          type: editingItem.type || '',
          quantity: '',
          price: '',
          symbol: '',
          purchase_date: '',
          rate: (editingItem.rate || '').toString(),
          due_date: editingItem.due_date ? editingItem.due_date.split('T')[0] : '',
        })
      }
    } else {
      setFormData({
        amount: '',
        account_type: '',
        description: '',
        interest_rate: '',
        debt_type: '',
        type: '',
        quantity: '',
        price: '',
        symbol: '',
        purchase_date: '',
        rate: '',
        due_date: '',
      })
    }
  }, [editingItem, activeTab, isOpen])

  if (!isOpen) return null

  // Preset templates
  const presets: Record<WealthCategory, { label: string; field: string; val: string; desc: string; rate?: string }[]> = {
    savings: [
      { label: 'Emergency Fund', field: 'account_type', val: 'Emergency Fund', desc: 'Liquid contingency reserve (6 months expenses)' },
      { label: 'Fixed Deposit (FD)', field: 'account_type', val: 'Fixed Deposit', desc: 'Guaranteed interest fixed deposit' },
      { label: 'High-Yield Savings', field: 'account_type', val: 'Savings Account', desc: 'Daily operating savings account' },
      { label: 'Public Provident (PPF)', field: 'account_type', val: 'PPF Account', desc: 'Government-backed tax-exempt compounding' },
    ],
    debts: [
      { label: 'Credit Card', field: 'debt_type', val: 'Credit Card', desc: 'Monthly high-rate revolving balance', rate: '36' },
      { label: 'Home Loan', field: 'debt_type', val: 'Home Loan', desc: 'Long-term residential mortgage', rate: '8.5' },
      { label: 'Car Loan', field: 'debt_type', val: 'Car Loan', desc: 'Vehicle financing EMI', rate: '9.2' },
      { label: 'Personal Loan', field: 'debt_type', val: 'Personal Loan', desc: 'Unsecured personal bank loan', rate: '13.5' },
    ],
    assets: [
      { label: 'Index Mutual Fund', field: 'type', val: 'Mutual Fund', desc: 'Nifty 50 Index Fund units' },
      { label: 'Direct Stocks', field: 'type', val: 'Equity Stocks', desc: 'Long-term blue-chip equity shares' },
      { label: 'Physical/Digital Gold', field: 'type', val: 'Gold Asset', desc: 'Sovereign gold bonds or bullion' },
      { label: 'Real Estate Property', field: 'type', val: 'Real Estate', desc: 'Land or apartment property holding' },
    ],
    liabilities: [
      { label: 'Business Overdraft', field: 'type', val: 'Bank Overdraft', desc: 'Working capital credit facility' },
      { label: 'Family/P2P Loan', field: 'type', val: 'Personal Borrowing', desc: 'Informal borrowed capital' },
      { label: 'Tax Provision', field: 'type', val: 'Tax Obligation', desc: 'Pending advance tax installment' },
    ],
  }

  const applyPreset = (p: { label: string; field: string; val: string; desc: string; rate?: string }) => {
    setFormData((prev) => ({
      ...prev,
      [p.field]: p.val,
      description: p.desc,
      interest_rate: p.rate || prev.interest_rate,
      rate: p.rate || prev.rate,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (activeTab === 'savings') {
        const payload = {
          amount: parseFloat(formData.amount) || 0,
          account_type: formData.account_type || 'Savings Account',
          description: formData.description,
        }
        if (editingItem && 'account_type' in editingItem) {
          await api.put(`/savings/${editingItem.id}`, payload)
        } else {
          await api.post('/savings', payload)
        }
      } else if (activeTab === 'debts') {
        const payload = {
          amount: parseFloat(formData.amount) || 0,
          interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : 0,
          debt_type: formData.debt_type || 'Loan',
          description: formData.description,
        }
        if (editingItem && 'debt_type' in editingItem) {
          await api.put(`/debts/${editingItem.id}`, payload)
        } else {
          await api.post('/debts', payload)
        }
      } else if (activeTab === 'assets') {
        if (!formData.type || formData.type.trim() === '') {
          setError('Asset type is required')
          setSubmitting(false)
          return
        }
        const payload = {
          type: formData.type.trim(),
          symbol: formData.symbol?.trim() || null,
          quantity: parseFloat(formData.quantity) || 0,
          price: parseFloat(formData.price) || 0,
          purchase_date: formData.purchase_date || null,
        }
        if (editingItem && 'quantity' in editingItem && editingItem.account_type === undefined) {
          await api.put(`/wealth/assets/${editingItem.id}`, payload)
        } else {
          await api.post('/wealth/assets', payload)
        }
      } else if (activeTab === 'liabilities') {
        const payload = {
          type: formData.type || 'Loan',
          amount: parseFloat(formData.amount) || 0,
          rate: formData.rate ? parseFloat(formData.rate) : null,
          due_date: formData.due_date || null,
        }
        if (editingItem && editingItem.account_type === undefined && editingItem.quantity === undefined) {
          await api.put(`/wealth/liabilities/${editingItem.id}`, payload)
        } else {
          await api.post('/wealth/liabilities', payload)
        }
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || err.message || 'Failed to save item')
    } finally {
      setSubmitting(false)
    }
  }

  // Live calculation preview
  const previewAmount =
    activeTab === 'assets'
      ? safeNumber(formData.quantity, 0) * safeNumber(formData.price, 0)
      : safeNumber(formData.amount, 0)

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="modal-panel max-w-lg overflow-y-auto p-5 animate-scale-in sm:p-6">
        {/* Glow backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary-100/60 blur-3xl"
        />

        {/* Mobile sheet handle */}
        <div aria-hidden="true" className="relative mx-auto -mt-1 mb-4 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="btn-icon absolute right-4 top-4 z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Title */}
        <div className="relative mb-5 flex items-start gap-3 pr-12">
          <span className="icon-tile">
            <Sparkles className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900 sm:text-xl">
              {editingItem ? 'Edit Entry' : 'Add New Wealth Entry'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Maintain high balance sheet fidelity for accurate AI projections
            </p>
          </div>
        </div>

        {/* Category Tabs (disabled during editing for consistency) */}
        {!editingItem && (
          <div className="segmented relative mb-5 flex w-full">
            {(['savings', 'debts', 'assets', 'liabilities'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-pressed={activeTab === tab}
                className={`segmented-item flex-1 px-2 py-2 capitalize ${
                  activeTab === tab ? 'segmented-item-active' : ''
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Quick Presets */}
        <div className="relative mb-5 space-y-2">
          <span className="eyebrow flex items-center gap-1.5 text-[10px]">
            <Sparkles className="h-3 w-3 text-primary-600" />
            Quick Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets[activeTab].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-lg border border-line-strong bg-white px-2.5 py-1.5 text-[11px] font-medium text-ink-700 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="surface-inset relative mb-5 overflow-hidden p-4">
          <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-primary-500 via-teal-400 to-sky-400" />
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-700">
              Live Card Preview
            </span>
            <span className={`kpi-value break-words text-base ${previewToneClass[activeTab]}`}>
              ₹{formatINR(previewAmount)}
            </span>
          </div>
          <div className="min-w-0 text-xs">
            <p className="truncate font-semibold text-ink-900">
              {activeTab === 'savings'
                ? formData.account_type || 'Savings Account'
                : activeTab === 'debts'
                ? formData.debt_type || 'Debt / Loan'
                : activeTab === 'assets'
                ? `${formData.type || 'Asset'}${formData.symbol ? ` (${formData.symbol.toUpperCase()})` : ''}`
                : formData.type || 'Liability'}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {formData.description || 'No notes added'}
            </p>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="relative space-y-4">
          {/* Amount (for savings, debts, liabilities) */}
          {activeTab !== 'assets' && (
            <div>
              <label className="label">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="input num"
              />
            </div>
          )}

          {/* Savings specific */}
          {activeTab === 'savings' && (
            <div>
              <label className="label">
                Account Type *
              </label>
              <input
                type="text"
                required
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                placeholder="e.g. Emergency Fund, Fixed Deposit, Liquid Mutual Fund"
                className="input"
              />
            </div>
          )}

          {/* Debts specific */}
          {activeTab === 'debts' && (
            <>
              <div>
                <label className="label">
                  Debt / Loan Type *
                </label>
                <input
                  type="text"
                  required
                  value={formData.debt_type}
                  onChange={(e) => setFormData({ ...formData, debt_type: e.target.value })}
                  placeholder="e.g. Credit Card, Home Mortgage, Personal Loan"
                  className="input"
                />
              </div>

              <div>
                <label className="label">
                  Annual Interest Rate (% APR)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  placeholder="e.g. 12.5"
                  className="input num"
                />
              </div>
            </>
          )}

          {/* Assets specific */}
          {activeTab === 'assets' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
                <div>
                  <label className="label">
                    Asset Type *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="e.g. Mutual Fund, Stock"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">
                    Symbol / Ticker
                  </label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="e.g. NIFTY50, INFY"
                    className="input num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    Quantity / Units *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="100"
                    className="input num"
                  />
                </div>
                <div>
                  <label className="label">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="250.00"
                    className="input num"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="input"
                />
              </div>
            </>
          )}

          {/* Liabilities specific */}
          {activeTab === 'liabilities' && (
            <>
              <div>
                <label className="label">
                  Liability Type *
                </label>
                <input
                  type="text"
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g. Tax Liability, Overdraft, Informal Loan"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="0.0"
                    className="input num"
                  />
                </div>
                <div>
                  <label className="label">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </>
          )}

          {/* Description */}
          <div>
            <label className="label">
              Notes & Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Maintained at HDFC Bank / ICICI Direct"
              className="input"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
            >
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 border-t border-line pt-4">
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
              className="btn-primary h-11 flex-1"
            >
              {submitting ? 'Saving...' : editingItem ? 'Update Entry' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
