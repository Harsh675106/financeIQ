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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="pf-orbit icon-morph-container flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
            <Wand2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-50">Projection Lab</h2>
            <p className="text-xs text-slate-400">Monte Carlo forecast, seeded from your data</p>
          </div>
        </div>

        <button
          onClick={onResetToMyData}
          className="pf-chip flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-300"
        >
          <RotateCcw className="h-3 w-3" />
          Use my data
        </button>
      </div>

      <div className="mt-5 space-y-5">
        {/* ---------- Starting capital ---------- */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label className="text-xs font-semibold text-slate-300">Starting Capital</label>
            <span className="text-[11px] text-slate-500">
              Your portfolio: {compactINR(derived.portfolioValue)}
            </span>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
              ₹
            </span>
            <input
              type="number"
              min={0}
              value={form.initialAmount}
              onChange={(e) => onChange({ initialAmount: e.target.value })}
              className="input pl-8 font-semibold"
            />
          </div>
        </div>

        {/* ---------- Monthly contribution ---------- */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label className="text-xs font-semibold text-slate-300">Monthly Contribution</label>
            <span className="text-[11px] text-slate-500">
              {derived.hasCashflow
                ? `Your surplus: ${compactINR(Math.max(0, derived.monthlySurplus))}/mo`
                : 'No transaction history yet'}
            </span>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
              ₹
            </span>
            <input
              type="number"
              min={0}
              value={form.monthlyContribution}
              onChange={(e) => onChange({ monthlyContribution: e.target.value })}
              className="input pl-8 font-semibold"
            />
          </div>
          <input
            type="range"
            min={0}
            max={monthlyMax}
            step={500}
            value={Math.min(monthly, monthlyMax)}
            onChange={(e) => onChange({ monthlyContribution: e.target.value })}
            className="pf-range mt-3"
          />
        </div>

        {/* ---------- Horizon ---------- */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label className="text-xs font-semibold text-slate-300">Time Horizon</label>
            <span className="text-sm font-extrabold text-primary-300">
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
            className="pf-range"
          />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {YEAR_CHIPS.map((y) => (
              <button
                key={y}
                onClick={() => onChange({ years: String(y) })}
                className={`pf-chip px-2.5 py-1 text-[11px] font-semibold ${
                  years === y ? 'pf-chip-active' : 'text-slate-400'
                }`}
              >
                {y}y
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Return / volatility presets ---------- */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-300">Return Assumptions</label>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={applyMyMix}
              className={`pf-chip flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold ${
                myMixActive ? 'pf-chip-active' : 'text-slate-400'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              My mix
            </button>
            {(Object.keys(RISK_PRESETS) as (keyof typeof RISK_PRESETS)[]).map((name) => (
              <button
                key={name}
                onClick={() => applyPreset(name)}
                className={`pf-chip px-2.5 py-1 text-[11px] font-semibold ${
                  presetActive(name) ? 'pf-chip-active' : 'text-slate-400'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-400">Expected Return (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.expectedReturn}
                onChange={(e) => onChange({ expectedReturn: e.target.value })}
                className="input py-2 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-400">Volatility (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.volatility}
                onChange={(e) => onChange({ volatility: e.target.value })}
                className="input py-2 text-sm font-semibold"
              />
            </div>
          </div>

          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Your mix blends to {(derived.profile.expectedReturn * 100).toFixed(1)}% return at{' '}
            {(derived.profile.volatility * 100).toFixed(1)}% volatility, using per-asset-class assumptions and their
            correlations.
          </p>
        </div>

        {/* ---------- Run ---------- */}
        <button
          onClick={onRun}
          disabled={running}
          className={`btn-primary w-full ${running ? 'pf-scan' : ''}`}
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
