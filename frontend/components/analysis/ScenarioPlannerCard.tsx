'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { FlaskConical } from 'lucide-react'

const scenarios = [
  { value: 'job_loss', label: 'Job loss' },
  { value: 'rent_increase', label: 'Rent increase' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'loan_prepayment', label: 'Loan prepayment' },
  { value: 'house_purchase', label: 'House purchase' },
  { value: 'market_crash', label: 'Market crash' },
  { value: 'new_child', label: 'New child' },
]

export default function ScenarioPlannerCard() {
  const [scenarioType, setScenarioType] = useState('job_loss')
  const [amount, setAmount] = useState('20000')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runScenario = async () => {
    setLoading(true)
    try {
      const payload =
        scenarioType === 'market_crash'
          ? { percentDrop: Number(amount), months: 6 }
          : scenarioType === 'house_purchase'
            ? { downPayment: Number(amount), monthlyHousingCost: 15000, months: 6 }
            : { amount: Number(amount), monthlyIncrease: Number(amount), months: 6 }

      const res = await api.post('/analytics/scenario-planner', { scenarioType, payload })
      setResult(res.data)
    } catch (error) {
      console.error('Failed to run scenario planner', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card card-pad card-hover">
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical className="h-5 w-5 text-primary-300" />
        <h3 className="text-lg font-semibold text-slate-50">What-If Lab</h3>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <select value={scenarioType} onChange={(e) => setScenarioType(e.target.value)} className="input">
          {scenarios.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className="input" placeholder="Amount" />
        <button onClick={runScenario} disabled={loading} className="btn-primary">
          {loading ? 'Running...' : 'Run scenario'}
        </button>
      </div>

      {result ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4">
            <div className="text-sm text-slate-100">{result.explanation}</div>
            <div className="text-xs text-slate-400 mt-2">
              Baseline cash {Math.round(result.baseline.cash).toLocaleString('en-IN')} | Final cash {Math.round(result.projected.finalCash).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {result.timeline?.slice(0, 3).map((item: any) => (
              <div key={item.month} className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-3 text-sm">
                <div className="text-slate-400">Month {item.month}</div>
                <div className="text-slate-100 mt-1">{Math.round(item.projectedCash).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-400">Simulate life events like job loss, bonus, rent increase, or a market crash.</div>
      )}
    </div>
  )
}
