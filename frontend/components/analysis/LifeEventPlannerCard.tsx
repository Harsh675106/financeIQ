'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { CalendarHeart, CheckCircle2, Sparkles, Target } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'

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
    <div className="card card-pad">
      <SectionHeader
        icon={CalendarHeart}
        tone="brand"
        title="Life Event Planner"
        subtitle="Turn real-life plans into funding targets, monthly saving goals, and tradeoff guidance."
        as="h3"
      />

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <select
          value={eventType}
          onChange={(e) => updateEventType(e.target.value)}
          className="input"
          aria-label="Life event"
        >
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
          className="input num"
          placeholder="Target amount"
          aria-label="Target amount"
          disabled={eventType === 'layoff_recovery'}
        />
        <input
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          type="date"
          className="input"
          aria-label="Target date"
        />
      </div>

      <button onClick={runPlanner} disabled={loading} className="btn-primary mt-4 w-full sm:w-auto">
        <Sparkles className="h-4 w-4" />
        {loading ? 'Planning...' : 'Build plan'}
      </button>

      {result ? (
        <div className="mt-6 space-y-4">
          <div className="surface-highlight p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="eyebrow">{result.eventLabel}</p>
                <h4 className="mt-1.5 text-base font-semibold leading-snug text-ink-900">{result.summary}</h4>
              </div>
              <span className="badge badge-brand num shrink-0 self-start px-3 py-1">
                <Target className="h-3.5 w-3.5" />
                {result.successProbability}% success chance
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="surface-inset bg-white/80 p-3 sm:p-4">
                <p className="eyebrow">Required monthly</p>
                <p className="kpi-value mt-2 text-lg sm:text-xl">
                  {Math.round(result.requiredMonthly).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="surface-inset bg-white/80 p-3 sm:p-4">
                <p className="eyebrow">Comfortable monthly</p>
                <p className="kpi-value mt-2 text-lg text-emerald-700 sm:text-xl">
                  {Math.round(result.comfortableMonthly).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="surface-inset bg-white/80 p-3 sm:p-4">
                <p className="eyebrow">Monthly gap</p>
                <p className={`kpi-value mt-2 text-lg sm:text-xl ${result.monthlyGap > 0 ? 'text-rose-600' : 'text-ink-900'}`}>
                  {Math.round(result.monthlyGap).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="surface-inset p-4">
              <p className="eyebrow mb-3">Recommendations</p>
              <div className="space-y-2">
                {result.recommendations.map((item) => (
                  <p key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-800">
                    <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                    <span className="min-w-0">{item}</span>
                  </p>
                ))}
              </div>
            </div>
            <div className="surface-inset p-4">
              <p className="eyebrow mb-3">Tradeoffs</p>
              <div className="space-y-2">
                {result.tradeoffs.length === 0 ? (
                  <p className="text-sm text-slate-500">No major tradeoffs detected right now.</p>
                ) : (
                  result.tradeoffs.map((item) => (
                    <p key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-800">
                      <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      <span className="min-w-0">{item}</span>
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.milestones.map((item) => (
              <div key={item.label} className="surface-inset relative overflow-hidden p-4">
                <span aria-hidden="true" className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-gradient-to-b from-primary-500 to-ice-400" />
                <p className="eyebrow">{item.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-800">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="surface-inset p-4">
              <p className="eyebrow">Assumptions</p>
              <div className="mt-2 space-y-2">
                {result.assumptions.map((item) => (
                  <p key={item} className="text-sm leading-relaxed text-slate-600">{item}</p>
                ))}
              </div>
            </div>
            <div className="surface-inset p-4">
              <p className="eyebrow">If assumptions change</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{result.whatChangesIfWrong}</p>
              <p className="mt-3 text-xs text-slate-500">
                <span className="badge badge-ai num">Confidence: {Math.round(result.confidence)}%</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className={`flex items-center gap-2 text-sm ${saveMessage.includes('successfully') ? 'text-emerald-700' : 'text-slate-500'}`}>
              {saveMessage.includes('successfully') && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {saveMessage || 'Turn this plan into a tracked goal with the recommended monthly contribution.'}
            </p>
            <button onClick={saveAsGoal} disabled={savingGoal} className="btn-primary w-full shrink-0 sm:w-auto">
              {savingGoal ? 'Saving...' : 'Save as goal'}
            </button>
          </div>
        </div>
      ) : (
        <div className="surface-inset mt-5 flex items-center gap-3 border-dashed border-line-strong p-4 text-sm text-slate-500">
          <span className="icon-tile icon-tile-sm icon-tile-slate">
            <CalendarHeart className="h-4 w-4" />
          </span>
          Plan events like a car purchase, higher studies, wedding, or emergency-fund rebuild after a layoff.
        </div>
      )}
    </div>
  )
}
