'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { CalendarHeart } from 'lucide-react'

const eventOptions = [
  { value: 'car_purchase', label: 'Car purchase', defaultAmount: 500000 },
  { value: 'higher_studies', label: 'Higher studies', defaultAmount: 800000 },
  { value: 'wedding', label: 'Wedding planning', defaultAmount: 1200000 },
  { value: 'layoff_recovery', label: 'Layoff recovery', defaultAmount: 0 },
]

interface PlannerResponse {
  eventType: string
  eventLabel: string
  summary: string
  targetDate: string
  targetAmount: number
  monthlyIncome: number
  monthlyExpense: number
  monthlySurplus: number
  currentCash: number
  usableCashToday: number
  requiredMonthly: number
  comfortableMonthly: number
  monthlyGap: number
  successProbability: number
  recommendations: string[]
  milestones: Array<{ label: string; detail: string }>
  tradeoffs: string[]
  assumptions: string[]
  whatChangesIfWrong: string
  confidence: number
}

export default function LifeEventPlannerCard() {
  const [eventType, setEventType] = useState('car_purchase')
  const [targetAmount, setTargetAmount] = useState('500000')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [result, setResult] = useState<PlannerResponse | null>(null)

  const updateEventType = (nextType: string) => {
    setEventType(nextType)
    const option = eventOptions.find((item) => item.value === nextType)
    setTargetAmount(String(option?.defaultAmount ?? 0))
  }

  const runPlanner = async () => {
    setLoading(true)
    setSaveMessage('')
    try {
      const payload: { targetAmount?: number; targetDate?: string } = {}
      if (eventType !== 'layoff_recovery') {
        payload.targetAmount = Number(targetAmount || 0)
      }
      if (targetDate) {
        payload.targetDate = targetDate
      }

      const response = await api.post('/analytics/life-event-planner', {
        eventType,
        payload,
      })
      setResult(response.data)
    } catch (error) {
      console.error('Failed to build life event plan', error)
    } finally {
      setLoading(false)
    }
  }

  const saveAsGoal = async () => {
    if (!result) return
    setSavingGoal(true)
    setSaveMessage('')
    try {
      await api.post('/goals', {
        name: result.eventLabel,
        target_amount: result.targetAmount,
        target_date: result.targetDate || null,
        monthly_contribution: result.requiredMonthly,
      })
      setSaveMessage('Saved to goals successfully.')
    } catch (error) {
      console.error('Failed to save life event as goal', error)
      setSaveMessage('Could not save this plan as a goal.')
    } finally {
      setSavingGoal(false)
    }
  }

  return (
    <div className="card card-pad card-hover">
      <div className="flex items-center gap-2 mb-4">
        <CalendarHeart className="h-5 w-5 text-primary-300" />
        <h3 className="text-lg font-semibold text-slate-50">Life Event Planner</h3>
      </div>

      <p className="text-sm text-slate-400 mb-4">
        Turn real-life plans into funding targets, monthly saving goals, and tradeoff guidance.
      </p>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <select value={eventType} onChange={(e) => updateEventType(e.target.value)} className="input">
          {eventOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          type="number"
          className="input"
          placeholder="Target amount"
          disabled={eventType === 'layoff_recovery'}
        />
        <input
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          type="date"
          className="input"
        />
      </div>

      <button onClick={runPlanner} disabled={loading} className="btn-primary mb-4">
        {loading ? 'Planning...' : 'Build plan'}
      </button>

      {result ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{result.eventLabel}</p>
                <h4 className="mt-1 text-base font-semibold text-slate-50">{result.summary}</h4>
              </div>
              <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs text-primary-200">
                {result.successProbability}% success chance
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-3 mt-4">
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Required monthly</p>
                <p className="mt-2 text-lg font-semibold text-slate-100">
                  {Math.round(result.requiredMonthly).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Comfortable monthly</p>
                <p className="mt-2 text-lg font-semibold text-emerald-300">
                  {Math.round(result.comfortableMonthly).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Monthly gap</p>
                <p className={`mt-2 text-lg font-semibold ${result.monthlyGap > 0 ? 'text-rose-300' : 'text-slate-100'}`}>
                  {Math.round(result.monthlyGap).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">Recommendations</p>
              <div className="space-y-2">
                {result.recommendations.map((item) => (
                  <p key={item} className="text-sm text-slate-200">{item}</p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">Tradeoffs</p>
              <div className="space-y-2">
                {result.tradeoffs.length === 0 ? (
                  <p className="text-sm text-slate-400">No major tradeoffs detected right now.</p>
                ) : (
                  result.tradeoffs.map((item) => (
                    <p key={item} className="text-sm text-slate-200">{item}</p>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {result.milestones.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm text-slate-200">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Assumptions</p>
              <div className="mt-2 space-y-2">
                {result.assumptions.map((item) => (
                  <p key={item} className="text-sm text-slate-300">{item}</p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">If assumptions change</p>
              <p className="mt-2 text-sm text-slate-300">{result.whatChangesIfWrong}</p>
              <p className="mt-3 text-xs text-slate-500">Confidence: {Math.round(result.confidence)}%</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className={`text-sm ${saveMessage.includes('successfully') ? 'text-emerald-300' : 'text-slate-400'}`}>
              {saveMessage || 'Turn this plan into a tracked goal with the recommended monthly contribution.'}
            </p>
            <button onClick={saveAsGoal} disabled={savingGoal} className="btn-primary">
              {savingGoal ? 'Saving...' : 'Save as goal'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-400">
          Plan events like a car purchase, higher studies, wedding, or emergency-fund rebuild after a layoff.
        </div>
      )}
    </div>
  )
}
