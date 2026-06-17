'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function BudgetsPanel() {
  const [budgets, setBudgets] = useState<any[]>([])
  const [period, setPeriod] = useState<{start:string, end:string} | null>(null)
  const [form, setForm] = useState({ category: '', amountMonthly: '' })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
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

  useEffect(() => { load() }, [])

  const save = async (e: any) => {
    e.preventDefault()
    try {
      await api.post('/budget', { category: form.category, amountMonthly: parseFloat(form.amountMonthly) })
      setForm({ category: '', amountMonthly: '' })
      load()
    } catch (e) {
      alert('Failed to save budget')
    }
  }

  return (
    <div className="card card-pad card-hover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-50">Budgets</h3>
        {period && (
          <span className="text-xs text-slate-400">{period.start} → {period.end}</span>
        )}
      </div>

      <form onSubmit={save} className="form-shell-lg grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input value={form.category} onChange={e=>setForm({...form, category: e.target.value})} placeholder="Category" className="input"/>
        <input value={form.amountMonthly} onChange={e=>setForm({...form, amountMonthly: e.target.value})} placeholder="Monthly Amount" type="number" step="0.01" className="input"/>
        <button className="btn-primary">Save</button>
      </form>

      {loading ? <div className="h-24 bg-slate-800/60 rounded-xl animate-pulse"/> : (
        <div className="space-y-3">
          {budgets.length===0 ? <div className="text-sm text-slate-400">No budgets set.</div> : budgets.map((b:any)=> (
            <div key={b.id} className={`p-3 rounded-xl border ${b.overspending ? 'border-danger-500/20 bg-danger-500/10' : 'border-slate-800/70 bg-slate-900/40'}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-100">{b.category}</div>
                <div className="text-xs text-slate-400">
                  Budget: ₹{b.amountMonthly.toLocaleString('en-IN')} · Spent: ₹{b.spent.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="mt-2 w-full bg-slate-800/70 rounded-full h-2 border border-slate-700">
                <div className={`h-2 rounded-full ${b.overspending ? 'bg-danger-400' : 'bg-primary-400'}`} style={{ width: `${b.progress}%` }} />
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Remaining ₹{b.remaining.toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
