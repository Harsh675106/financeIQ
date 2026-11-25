'use client'

import { Info, Play, RotateCcw, Sparkles, Wand2 } from 'lucide-react'
import { blendProfile, compactINR, type BlendedProfile } from '@/lib/portfolioMath'

export interface ProjectionForm {
  initialAmount: string
  monthlyContribution: string
  years: string
  expectedReturn: string
  volatility: string
}

interface Props {
  form: ProjectionForm
  onChange: (patch: Partial<ProjectionForm>) => void
  onRun: () => void
  onResetToMyData: () => void
  running: boolean
  /** Values derived from the user's own data, shown as hints and used by "Use my data". */
  derived: {
    portfolioValue: number
    monthlySurplus: number
    profile: BlendedProfile
    hasCashflow: boolean
  }
}

/** Standard risk archetypes — identical to the backend's target allocations. */
const RISK_PRESETS = {
  Conservative: { equity: 20, debt: 60, gold: 10, liquid: 10 },
  Balanced: { equity: 50, debt: 30, gold: 10, liquid: 10 },
  Aggressive: { equity: 70, debt: 15, gold: 10, liquid: 5 },
} as const

const YEAR_CHIPS = [5, 10, 15, 20, 25, 30]

export default function ProjectionLab({ form, onChange, onRun, onResetToMyData, running, derived }: Props) {
  const years = Math.max(1, Math.min(40, parseInt(form.years) || 1))
  const monthly = Math.max(0, parseFloat(form.monthlyContribution) || 0)

  // Cap the contribution slider generously above both the current value and the user's surplus.
  const monthlyMax = Math.max(10000, Math.ceil((Math.max(monthly, derived.monthlySurplus) * 2) / 1000) * 1000)

  const applyPreset = (name: keyof typeof RISK_PRESETS) => {
    const profile = blendProfile(RISK_PRESETS[name])
    onChange({
      expectedReturn: (profile.expectedReturn * 100).toFixed(1),
      volatility: (profile.volatility * 100).toFixed(1),
    })
  }

  const applyMyMix = () => {
    onChange({
      expectedReturn: (derived.profile.expectedReturn * 100).toFixed(1),
      volatility: (derived.profile.volatility * 100).toFixed(1),
    })
  }

  const myMixActive =
    form.expectedReturn === (derived.profile.expectedReturn * 100).toFixed(1) &&
    form.volatility === (derived.profile.volatility * 100).toFixed(1)

  const presetActive = (name: keyof typeof RISK_PRESETS) => {
    const p = blendProfile(RISK_PRESETS[name])
    return (
      form.expectedReturn === (p.expectedReturn * 100).toFixed(1) &&
      form.volatility === (p.volatility * 100).toFixed(1)
    )
  }

  return (
    <div className="pf-panel pf-rise p-5 sm:p-6" style={{ animationDelay: '140ms' }}>
      {/* ---------- Header ---------- */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="pf-orbit icon-tile icon-tile-sky icon-morph-container">
            <Wand2 className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h2 className="card-title truncate">Projection Lab</h2>
            <p className="card-subtitle">Monte Carlo forecast, seeded from your data</p>
          </div>
        </div>

        <button
          onClick={onResetToMyData}
          className="pf-chip inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-ink-700"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Use my data
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {/* ---------- Starting capital ---------- */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label className="shrink-0 text-[13px] font-medium text-ink-700">Starting Capital</label>
            <span className="num min-w-0 truncate text-[11px] text-slate-500">
              Your portfolio: {compactINR(derived.portfolioValue)}
            </span>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary-600">
              ₹
            </span>
            <input
              type="number"
              min={0}
              value={form.initialAmount}
              onChange={(e) => onChange({ initialAmount: e.target.value })}
              className="input num pl-9 font-semibold"
            />
          </div>
        </div>

        {/* ---------- Monthly contribution ---------- */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label className="shrink-0 text-[13px] font-medium text-ink-700">Monthly Contribution</label>
            <span className="num min-w-0 truncate text-[11px] text-slate-500">
              {derived.hasCashflow
                ? `Your surplus: ${compactINR(Math.max(0, derived.monthlySurplus))}/mo`
                : 'No transaction history yet'}
            </span>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary-600">
              ₹
            </span>
            <input
              type="number"
              min={0}
              value={form.monthlyContribution}
              onChange={(e) => onChange({ monthlyContribution: e.target.value })}
              className="input num pl-9 font-semibold"
            />
          </div>
          <input
            type="range"
            min={0}
            max={monthlyMax}
            step={500}
            value={Math.min(monthly, monthlyMax)}
            onChange={(e) => onChange({ monthlyContribution: e.target.value })}
            aria-label="Monthly contribution"
            className="pf-range mt-4"
          />
        </div>

        {/* ---------- Horizon ---------- */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label className="shrink-0 text-[13px] font-medium text-ink-700">Time Horizon</label>
            <span className="num font-display text-sm font-semibold text-primary-700">
              {years} year{years === 1 ? '' : 's'}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={40}
            step={1}
            value={years}
            onChange={(e) => onChange({ years: e.target.value })}
            aria-label="Time horizon in years"
            className="pf-range mt-1"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {YEAR_CHIPS.map((y) => (
              <button
                key={y}
                onClick={() => onChange({ years: String(y) })}
                aria-pressed={years === y}
                className={`pf-chip num min-w-[2.75rem] px-2.5 py-1.5 text-[11px] font-semibold ${
                  years === y ? 'pf-chip-active' : 'text-slate-500'
                }`}
              >
                {y}y
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Return / volatility presets ---------- */}
        <div>
          <label className="mb-2 block text-[13px] font-medium text-ink-700">Return Assumptions</label>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={applyMyMix}
              aria-pressed={myMixActive}
              className={`pf-chip inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold ${
                myMixActive ? 'pf-chip-active' : 'text-slate-500'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              My mix
            </button>
            {(Object.keys(RISK_PRESETS) as (keyof typeof RISK_PRESETS)[]).map((name) => (
              <button
                key={name}
                onClick={() => applyPreset(name)}
                aria-pressed={presetActive(name)}
                className={`pf-chip px-2.5 py-1.5 text-[11px] font-semibold ${
                  presetActive(name) ? 'pf-chip-active' : 'text-slate-500'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-slate-500">Expected Return (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.expectedReturn}
                onChange={(e) => onChange({ expectedReturn: e.target.value })}
                className="input num py-2 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-slate-500">Volatility (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.volatility}
                onChange={(e) => onChange({ volatility: e.target.value })}
                className="input num py-2 text-sm font-semibold"
              />
            </div>
          </div>

          <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
            <Info className="mt-0.5 h-3 w-3 shrink-0 text-sky-600" />
            Your mix blends to {(derived.profile.expectedReturn * 100).toFixed(1)}% return at{' '}
            {(derived.profile.volatility * 100).toFixed(1)}% volatility, using per-asset-class assumptions and their
            correlations.
          </p>
        </div>

        {/* ---------- Run ---------- */}
        <button
          onClick={onRun}
          disabled={running}
          className={`btn-primary btn-lg w-full ${running ? 'pf-scan' : ''}`}
        >
          {running ? (
            <>
              <span className="flex h-4 items-end gap-[3px]">
                <span className="pf-eq-bar" />
                <span className="pf-eq-bar" />
                <span className="pf-eq-bar" />
                <span className="pf-eq-bar" />
              </span>
              Running 10,000 paths…
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Simulation
            </>
          )}
        </button>
      </div>
    </div>
  )
}
