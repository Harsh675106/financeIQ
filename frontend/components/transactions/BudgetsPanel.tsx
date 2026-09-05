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
    <div className="relative overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950/95 p-6 md:p-8 shadow-2xl backdrop-blur-xl stage-card-lift">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/25 to-purple-500/15 border border-indigo-500/40 shadow-lg text-indigo-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              Monthly Budget Guardrails
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                <Sparkles className="h-3.5 w-3.5" /> Active Watchdog
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {period ? `Current cycle: ${period.start} → ${period.end}` : 'Track spending thresholds against monthly targets'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 rounded-2xl bg-slate-800/90 px-4 py-2 text-xs font-bold text-primary-400 border border-primary-500/30 hover:bg-primary-500/15 transition shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{showAddForm ? 'Close Target Form' : 'New Budget Cap'}</span>
        </button>
      </div>

      {/* Add Budget Form */}
      {showAddForm && (
        <form onSubmit={save} className="mb-6 rounded-2xl border border-slate-700/80 bg-slate-950/60 p-4 space-y-3 animate-scale-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Dining, Groceries, Shopping"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Monthly Budget Cap (₹)</label>
              <input
                value={form.amountMonthly}
                onChange={(e) => setForm({ ...form, amountMonthly: e.target.value })}
                placeholder="e.g. 15000"
                type="number"
                step="100"
                min="100"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-primary-500 px-4 py-2 text-xs font-black text-slate-950 shadow-md transition hover:bg-primary-400"
          >
            Save Target Cap
          </button>
        </form>
      )}

      {/* Budgets List */}
      {loading ? (
        <div className="h-32 bg-slate-800/40 rounded-2xl animate-pulse border border-slate-800" />
      ) : budgets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800/90 bg-slate-900/40 p-6 text-center text-xs text-slate-400">
          No category budgets configured yet. Add budget targets above to prevent overspending.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b: any) => {
            const isOver = b.overspending || b.spent > b.amountMonthly
            const pct = Math.min(100, Math.round((b.spent / b.amountMonthly) * 100))

            return (
              <div
                key={b.id}
                className={`rounded-2xl border p-4.5 transition ${
                  isOver
                    ? 'border-rose-500/40 bg-rose-950/20 shadow-lg shadow-rose-500/5'
                    : 'border-slate-800/90 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${isOver ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                    <h4 className="text-sm font-bold text-slate-100">{b.category}</h4>
                  </div>
                  <span className={`text-xs font-bold font-mono ${isOver ? 'text-rose-400' : 'text-slate-300'}`}>
                    {pct}% Consumed
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden my-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isOver
                        ? 'bg-rose-500'
                        : pct > 80
                        ? 'bg-amber-400'
                        : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono mt-2">
                  <span>Spent: ₹{Math.round(b.spent).toLocaleString('en-IN')}</span>
                  <span className={isOver ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
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
