'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Sparkles,
  TrendingDown,
  Layers
} from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

export default function BudgetsPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [budgets, setBudgets] = useState<any[]>([])
  const [period, setPeriod] = useState<{ start: string; end: string } | null>(null)
  const [form, setForm] = useState({ category: '', amountMonthly: '' })
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await api.get('/budget')
      setBudgets(res.data.budgets || [])
      setPeriod(res.data.period)
    } catch (e) {
      console.error('Budget load failed', e)
      setBudgets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [refreshKey])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.category || !form.amountMonthly || parseFloat(form.amountMonthly) <= 0) return
    try {
      await api.post('/budget', {
        category: form.category,
        amountMonthly: parseFloat(form.amountMonthly),
      })
      setForm({ category: '', amountMonthly: '' })
      setShowAddForm(false)
      load()
    } catch (e) {
      alert('Failed to save budget target')
    }
  }

  return (
    <div className="card card-pad relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-500/10 blur-3xl"
      />

      {/* Header */}
      <div className="relative mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile">
            <Layers className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="card-title">Monthly Budget Guardrails</h3>
              <span className="badge badge-brand">
                <Sparkles className="h-3 w-3" /> Active Watchdog
              </span>
            </div>
            <p className="card-subtitle">
              {period ? `Current cycle: ${period.start} → ${period.end}` : 'Track spending thresholds against monthly targets'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          aria-expanded={showAddForm}
          className="btn-soft btn-sm h-9 self-start px-3.5 sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{showAddForm ? 'Close Target Form' : 'New Budget Cap'}</span>
        </button>
      </div>

      {/* Add Budget Form */}
      {showAddForm && (
        <form onSubmit={save} className="surface-inset relative mb-6 space-y-4 p-4 animate-scale-in">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Dining, Groceries, Shopping"
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Monthly Budget Cap (₹)</label>
              <input
                value={form.amountMonthly}
                onChange={(e) => setForm({ ...form, amountMonthly: e.target.value })}
                placeholder="e.g. 15000"
                type="number"
                step="100"
                min="100"
                required
                className="input num"
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
          >
            Save Target Cap
          </button>
        </form>
      )}

      {/* Budgets List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          <div className="skeleton h-28" />
          <div className="skeleton hidden h-28 md:block" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="relative rounded-2xl border border-dashed border-white/10">
          <EmptyState
            compact
            icon={Wallet}
            tone="slate"
            title="No category budgets configured yet."
            description="Add budget targets above to prevent overspending."
          />
        </div>
      ) : (
        <div className="relative grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          {budgets.map((b: any) => {
            const isOver = b.overspending || b.spent > b.amountMonthly
            const pct = Math.min(100, Math.round((b.spent / b.amountMonthly) * 100))

            return (
              <div
                key={b.id}
                className={`surface-inset p-4 transition-colors ${
                  isOver
                    ? 'border-rose-500/30 bg-rose-500/[0.06] shadow-[0_12px_32px_-20px_rgba(244,63,94,0.6)]'
                    : 'hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        isOver ? 'animate-pulse bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)]' : 'bg-emerald-400'
                      }`}
                    />
                    <h4 className="truncate text-sm font-semibold text-slate-100">{b.category}</h4>
                  </div>
                  <span className={`num shrink-0 text-xs font-semibold ${isOver ? 'text-rose-300' : 'text-slate-300'}`}>
                    {pct}% Consumed
                  </span>
                </div>

                {/* Progress bar */}
                <div className="progress-track my-3">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ${
                      isOver
                        ? 'from-rose-500 to-pink-400'
                        : pct > 80
                        ? 'from-amber-400 to-orange-400'
                        : 'from-emerald-400 to-teal-300'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="num flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span>Spent: ₹{Math.round(b.spent).toLocaleString('en-IN')}</span>
                  <span className={isOver ? 'font-semibold text-rose-300' : 'text-emerald-300'}>
                    {isOver
                      ? `Exceeded by ₹${Math.round(b.spent - b.amountMonthly).toLocaleString('en-IN')}`
                      : `Safe: ₹${Math.round(b.amountMonthly - b.spent).toLocaleString('en-IN')} left`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
