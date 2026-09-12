/**
 * Portfolio analytics math.
 *
 * Every function here is pure and derives its output from real user data
 * (holdings, savings and transactions) — no placeholder constants are used for
 * amounts. Only forward-looking capital-market assumptions (per-asset-class
 * expected return / volatility / correlation and long-run inflation) are
 * modelled, and those are declared explicitly below so the UI can cite them.
 */

import { safeNumber } from './formatters'

export type AssetBucket = 'equity' | 'debt' | 'gold' | 'liquid'

export const BUCKETS: AssetBucket[] = ['equity', 'debt', 'gold', 'liquid']

/**
 * Long-run capital market assumptions (nominal, INR).
 * Volatilities intentionally mirror the backend risk model in
 * backend/routes/portfolio.js so risk numbers stay consistent across the app.
 */
export const ASSET_CLASS_MODEL: Record<
  AssetBucket,
  { label: string; short: string; expectedReturn: number; volatility: number; color: string }
> = {
  equity: { label: 'Equity & Growth', short: 'Equity', expectedReturn: 0.12, volatility: 0.18, color: '#0ea5e9' },
  debt: { label: 'Debt & Bonds', short: 'Debt', expectedReturn: 0.07, volatility: 0.05, color: '#10b981' },
  gold: { label: 'Gold & Commodities', short: 'Gold', expectedReturn: 0.08, volatility: 0.12, color: '#f59e0b' },
  liquid: { label: 'Liquid & Cash', short: 'Liquid', expectedReturn: 0.04, volatility: 0.01, color: '#8b5cf6' },
}

/** Long-run Indian CPI assumption used for real (inflation-adjusted) values. */
export const INFLATION_ASSUMPTION = 0.06

/** Pairwise correlations between asset classes. Symmetric, diagonal = 1. */
const CORRELATION: Record<AssetBucket, Record<AssetBucket, number>> = {
  equity: { equity: 1, debt: 0.1, gold: -0.05, liquid: 0 },
  debt: { debt: 1, equity: 0.1, gold: 0.15, liquid: 0.2 },
  gold: { gold: 1, equity: -0.05, debt: 0.15, liquid: 0 },
  liquid: { liquid: 1, equity: 0, debt: 0.2, gold: 0 },
}

/** Volatility that maps to a risk score of 100. Matches the backend cap. */
const MAX_MODELLED_VOLATILITY = 0.2

export type Weights = Record<AssetBucket, number>

export interface BlendedProfile {
  /** Weights as fractions of 1, normalised. */
  weights: Weights
  /** Expected nominal annual return, as a fraction (0.11 = 11%). */
  expectedReturn: number
  /** Annual standard deviation, as a fraction. */
  volatility: number
  /** 0-100, scaled against MAX_MODELLED_VOLATILITY. */
  riskScore: number
  riskLevel: 'Conservative' | 'Balanced' | 'Aggressive'
  /** 0-100 normalised inverse Herfindahl index across the four buckets. */
  diversification: number
}

/** Normalise percentage weights (which may not sum to exactly 100) to fractions of 1. */
export function normaliseWeights(raw: Partial<Record<AssetBucket, number>> | null | undefined): Weights {
  const values = BUCKETS.map((b) => Math.max(0, safeNumber(raw?.[b], 0)))
  const sum = values.reduce((a, b) => a + b, 0)

  const weights = {} as Weights
  BUCKETS.forEach((bucket, i) => {
    weights[bucket] = sum > 0 ? values[i] / sum : 0
  })
  return weights
}

/**
 * Blended expected return and volatility for a set of weights.
 *
 * Return  : E[Rp] = Σ wᵢ·rᵢ
 * Variance: σp²   = Σᵢ Σⱼ wᵢ·wⱼ·σᵢ·σⱼ·ρᵢⱼ   (full covariance, not an independence shortcut)
 */
export function blendProfile(raw: Partial<Record<AssetBucket, number>> | null | undefined): BlendedProfile {
  const weights = normaliseWeights(raw)
  const invested = BUCKETS.reduce((sum, b) => sum + weights[b], 0)

  let expectedReturn = 0
  let variance = 0

  for (const i of BUCKETS) {
    expectedReturn += weights[i] * ASSET_CLASS_MODEL[i].expectedReturn
    for (const j of BUCKETS) {
      variance +=
        weights[i] *
        weights[j] *
        ASSET_CLASS_MODEL[i].volatility *
        ASSET_CLASS_MODEL[j].volatility *
        CORRELATION[i][j]
    }
  }

  const volatility = Math.sqrt(Math.max(0, variance))
  const riskScore = clamp(Math.round((volatility / MAX_MODELLED_VOLATILITY) * 100), 0, 100)
  const riskLevel = riskScore < 35 ? 'Conservative' : riskScore < 65 ? 'Balanced' : 'Aggressive'

  // Normalised inverse Herfindahl: 100 = perfectly even across all four buckets, 0 = single bucket.
  const hhi = BUCKETS.reduce((sum, b) => sum + weights[b] * weights[b], 0)
  const minHhi = 1 / BUCKETS.length
  const diversification =
    invested > 0 ? clamp(Math.round(((1 - hhi) / (1 - minHhi)) * 100), 0, 100) : 0

  return { weights, expectedReturn, volatility, riskScore, riskLevel, diversification }
}

/* ============================ CASH FLOW ============================ */

export interface CashflowSummary {
  /** Distinct calendar months of transaction history used for the averages. */
  months: number
  monthlyIncome: number
  monthlyExpense: number
  /** Average monthly income − expense. Can be negative. */
  monthlySurplus: number
  /** Surplus ÷ income, as a percentage (0 when there is no income). */
  savingsRate: number
  /** True when at least one transaction was found. */
  hasData: boolean
  /** True when the averages come from the trailing 12 months rather than all history. */
  trailingWindow: boolean
}

const EMPTY_CASHFLOW: CashflowSummary = {
  months: 0,
  monthlyIncome: 0,
  monthlyExpense: 0,
  monthlySurplus: 0,
  savingsRate: 0,
  hasData: false,
  trailingWindow: false,
}

/**
 * Average monthly income, expense and investable surplus from real transactions.
 *
 * Averages are taken over the number of distinct calendar months that actually
 * contain transactions — dividing by a fixed 12 would understate the run-rate
 * for users with only a few months of history.
 */
export function summariseCashflow(transactions: any[] | null | undefined): CashflowSummary {
  if (!Array.isArray(transactions) || transactions.length === 0) return EMPTY_CASHFLOW

  const parsed = transactions
    .map((t) => {
      const date = new Date(t?.date ?? t?.created_at)
      return {
        time: date.getTime(),
        monthKey: `${date.getUTCFullYear()}-${date.getUTCMonth()}`,
        type: String(t?.type ?? '').toLowerCase(),
        amount: Math.abs(safeNumber(t?.amount, 0)),
      }
    })
    .filter((t) => Number.isFinite(t.time) && (t.type === 'income' || t.type === 'expense'))

  if (parsed.length === 0) return EMPTY_CASHFLOW

  const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000
  const recent = parsed.filter((t) => t.time >= cutoff)
  const rows = recent.length > 0 ? recent : parsed

  const monthKeys = new Set(rows.map((t) => t.monthKey))
  const months = Math.max(1, monthKeys.size)

  let income = 0
  let expense = 0
  for (const row of rows) {
    if (row.type === 'income') income += row.amount
    else expense += row.amount
  }

  const monthlyIncome = income / months
  const monthlyExpense = expense / months
  const monthlySurplus = monthlyIncome - monthlyExpense

  return {
    months,
    monthlyIncome,
    monthlyExpense,
    monthlySurplus,
    savingsRate: monthlyIncome > 0 ? (monthlySurplus / monthlyIncome) * 100 : 0,
    hasData: true,
    trailingWindow: recent.length > 0,
  }
}

/* ============================ PROJECTION ============================ */

/** Convert an annual rate to its geometrically equivalent monthly rate. */
export function monthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1
}

export interface ProjectionPoint {
  year: number
  /** Capital actually put in by this point: initial + monthly × months. */
  contributed: number
  /** Expected balance ignoring volatility. */
  value: number
  /** value − contributed. */
  growth: number
}

/**
 * Deterministic expected growth path (no volatility).
 *
 * Contributions are applied at the END of each month, matching the Monte Carlo
 * engines in both ml-service/app.py and the backend fallback, so this line is
 * the volatility-free centre of the same model:
 *
 *   V(n) = P·(1+m)^n + C·((1+m)^n − 1) / m
 */
export function projectExpectedPath(
  initialAmount: number,
  monthlyContribution: number,
  years: number,
  annualReturn: number
): ProjectionPoint[] {
  const principal = Math.max(0, safeNumber(initialAmount, 0))
  const contribution = Math.max(0, safeNumber(monthlyContribution, 0))
  const totalYears = Math.max(1, Math.round(safeNumber(years, 1)))
  const m = monthlyRate(annualReturn)

  const points: ProjectionPoint[] = []

  for (let year = 0; year <= totalYears; year++) {
    const n = year * 12
    const compound = Math.pow(1 + m, n)
    const futureValue =
      m === 0 ? principal + contribution * n : principal * compound + contribution * ((compound - 1) / m)
    const contributed = principal + contribution * n

    points.push({
      year,
      contributed: Math.round(contributed),
      value: Math.round(futureValue),
      growth: Math.round(Math.max(0, futureValue - contributed)),
    })
  }

  return points
}

/** Total capital the user will have deployed over the horizon. Exact, not modelled. */
export function totalCapitalDeployed(initialAmount: number, monthlyContribution: number, years: number): number {
  return (
    Math.max(0, safeNumber(initialAmount, 0)) +
    Math.max(0, safeNumber(monthlyContribution, 0)) * 12 * Math.max(0, safeNumber(years, 0))
  )
}

/** Purchasing power of a future nominal amount in today's rupees. */
export function toRealValue(nominal: number, years: number, inflation = INFLATION_ASSUMPTION): number {
  return safeNumber(nominal, 0) / Math.pow(1 + inflation, Math.max(0, safeNumber(years, 0)))
}

/**
 * Annualised growth rate of the whole plan, solved from the money actually
 * invested rather than from the initial amount alone (which would ignore every
 * monthly contribution and badly overstate the return).
 *
 * Solves for the monthly IRR m where:  P·(1+m)^n + C·((1+m)^n − 1)/m = FV
 * via bisection, then annualises it.
 */
export function solveAnnualisedReturn(
  initialAmount: number,
  monthlyContribution: number,
  years: number,
  futureValue: number
): number {
  const P = Math.max(0, safeNumber(initialAmount, 0))
  const C = Math.max(0, safeNumber(monthlyContribution, 0))
  const n = Math.max(1, Math.round(safeNumber(years, 1))) * 12
  const FV = safeNumber(futureValue, 0)

  if (P + C <= 0 || FV <= 0) return 0

  const balanceAt = (m: number) => {
    if (Math.abs(m) < 1e-12) return P + C * n
    const compound = Math.pow(1 + m, n)
    return P * compound + C * ((compound - 1) / m)
  }

  let low = -0.9 / 12
  let high = 1

  if (balanceAt(low) > FV) return Math.pow(1 + low, 12) - 1
  if (balanceAt(high) < FV) return Math.pow(1 + high, 12) - 1

  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2
    if (balanceAt(mid) < FV) low = mid
    else high = mid
  }

  return Math.pow(1 + (low + high) / 2, 12) - 1
}

/* ============================ DISTRIBUTION ============================ */

export interface PercentilePoint {
  percentile: number
  value: number
}

/**
 * Build the empirical percentile ladder from a simulation response, keeping
 * only the points the engine actually returned and sorting them by value.
 */
export function percentileLadder(sim: any): PercentilePoint[] {
  if (!sim) return []

  const candidates: PercentilePoint[] = [
    { percentile: 0, value: safeNumber(sim.minimum, NaN) },
    { percentile: 5, value: safeNumber(sim.percentile5 ?? sim.worstCase, NaN) },
    { percentile: 25, value: safeNumber(sim.percentile25, NaN) },
    { percentile: 50, value: safeNumber(sim.median, NaN) },
    { percentile: 75, value: safeNumber(sim.percentile75, NaN) },
    { percentile: 95, value: safeNumber(sim.percentile95 ?? sim.bestCase, NaN) },
    { percentile: 100, value: safeNumber(sim.maximum, NaN) },
  ]

  return candidates
    .filter((p) => Number.isFinite(p.value))
    .sort((a, b) => a.percentile - b.percentile)
}

/**
 * Estimated probability that the final balance lands at or above `target`,
 * by linear interpolation across the simulated percentile ladder.
 * Returns a percentage 0-100, or null when the ladder is too sparse.
 */
export function probabilityOfAtLeast(ladder: PercentilePoint[], target: number): number | null {
  if (ladder.length < 2 || !Number.isFinite(target)) return null

  const first = ladder[0]
  const last = ladder[ladder.length - 1]
  if (target <= first.value) return 100
  if (target >= last.value) return 0

  for (let i = 0; i < ladder.length - 1; i++) {
    const a = ladder[i]
    const b = ladder[i + 1]
    if (target >= a.value && target <= b.value) {
      const span = b.value - a.value
      const fraction = span === 0 ? 0 : (target - a.value) / span
      const percentileBelow = a.percentile + fraction * (b.percentile - a.percentile)
      return clamp(Math.round(100 - percentileBelow), 0, 100)
    }
  }

  return null
}

/* ============================ UTIL ============================ */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Compact INR label for chart axes: ₹1.2Cr, ₹45.0L, ₹8.3K. */
export function compactINR(value: any): string {
  const n = safeNumber(value, 0)
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''

  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(abs >= 1e8 ? 0 : 1)}Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(abs >= 1e6 ? 0 : 1)}L`
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}K`
  return `${sign}₹${Math.round(abs)}`
}
