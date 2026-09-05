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
import { WealthCategory, WealthItem } from './WealthItemCard'

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
      ? (parseFloat(formData.quantity) || 0) * (parseFloat(formData.price) || 0)
      : parseFloat(formData.amount) || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative my-8 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl animate-scale-in">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary-500/15 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Title */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-50 flex items-center gap-2">
            {editingItem ? 'Edit Entry' : 'Add New Wealth Entry'}
            <Sparkles className="h-4 w-4 text-primary-400" />
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintain high balance sheet fidelity for accurate AI projections
          </p>
        </div>

        {/* Category Tabs (disabled during editing for consistency) */}
        {!editingItem && (
          <div className="mb-5 flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/60">
            {(['savings', 'debts', 'assets', 'liabilities'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-primary-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Quick Presets */}
        <div className="mb-5 space-y-1.5">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary-400" />
            Quick Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets[activeTab].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-primary-400 hover:text-white transition"
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="mb-5 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="uppercase tracking-wider text-[10px] font-bold text-primary-400">
              Live Card Preview
            </span>
            <span className="font-mono text-sm font-bold text-slate-100">
              ₹{Math.round(previewAmount).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-xs">
            <p className="font-semibold text-slate-200">
              {activeTab === 'savings'
                ? formData.account_type || 'Savings Account'
                : activeTab === 'debts'
                ? formData.debt_type || 'Debt / Loan'
                : activeTab === 'assets'
                ? `${formData.type || 'Asset'}${formData.symbol ? ` (${formData.symbol.toUpperCase()})` : ''}`
                : formData.type || 'Liability'}
            </p>
            <p className="text-slate-400 text-[11px] mt-0.5 truncate">
              {formData.description || 'No notes added'}
            </p>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Amount (for savings, debts, liabilities) */}
          {activeTab !== 'assets' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm font-mono text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Savings specific */}
          {activeTab === 'savings' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Account Type *
              </label>
              <input
                type="text"
                required
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                placeholder="e.g. Emergency Fund, Fixed Deposit, Liquid Mutual Fund"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Debts specific */}
          {activeTab === 'debts' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Debt / Loan Type *
                </label>
                <input
                  type="text"
                  required
                  value={formData.debt_type}
                  onChange={(e) => setFormData({ ...formData, debt_type: e.target.value })}
                  placeholder="e.g. Credit Card, Home Mortgage, Personal Loan"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm font-mono text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </>
          )}

          {/* Assets specific */}
          {activeTab === 'assets' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Asset Type *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="e.g. Mutual Fund, Stock"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Symbol / Ticker
                  </label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="e.g. NIFTY50, INFY"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm font-mono text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm font-mono text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm font-mono text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-slate-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </>
          )}

          {/* Liabilities specific */}
          {activeTab === 'liabilities' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Liability Type *
                </label>
                <input
                  type="text"
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g. Tax Liability, Overdraft, Informal Loan"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="0.0"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm font-mono text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-slate-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notes & Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Maintained at HDFC Bank / ICICI Direct"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          {/* Action buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-primary-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-primary-400 shadow-lg shadow-primary-500/20 transition flex items-center justify-center gap-1.5"
            >
              {submitting ? 'Saving...' : editingItem ? 'Update Entry' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
