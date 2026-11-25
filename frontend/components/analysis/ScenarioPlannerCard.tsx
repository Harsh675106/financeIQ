'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { FlaskConical, Play, Sparkles } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'

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
    <div className="card card-pad">
      <SectionHeader icon={FlaskConical} tone="sky" title="What-If Lab" as="h3" />

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <select
          value={scenarioType}
          onChange={(e) => setScenarioType(e.target.value)}
          className="input"
          aria-label="Scenario"
        >
          {scenarios.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          className="input num"
          placeholder="Amount"
          aria-label="Amount"
        />
        <button onClick={runScenario} disabled={loading} className="btn-primary">
          <Play className="h-4 w-4" />
          {loading ? 'Running...' : 'Run scenario'}
        </button>
      </div>

      {result ? (
        <div className="mt-5 space-y-3">
          <div className="rounded-xl border border-ice-100 bg-ice-50/60 p-4">
            <div className="text-sm leading-relaxed text-ink-800">{result.explanation}</div>
            <div className="num mt-2 text-xs text-slate-500">
              Baseline cash {Math.round(result.baseline.cash).toLocaleString('en-IN')} | Final cash {Math.round(result.projected.finalCash).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {result.timeline?.slice(0, 3).map((item: any) => (
              <div key={item.month} className="surface-inset p-3 sm:p-4">
                <div className="eyebrow">Month {item.month}</div>
                <div className="kpi-value mt-1.5 text-lg">{Math.round(item.projectedCash).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="surface-inset mt-5 flex items-center gap-3 border-dashed border-line-strong p-4 text-sm text-slate-500">
          <span className="icon-tile icon-tile-sm icon-tile-slate">
            <Sparkles className="h-4 w-4" />
          </span>
          Simulate life events like job loss, bonus, rent increase, or a market crash.
        </div>
      )}
    </div>
  )
}
