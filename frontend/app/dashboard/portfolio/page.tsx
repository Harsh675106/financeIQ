'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PageBackground from '@/components/layouts/PageBackground'
import PortfolioHero from '@/components/portfolio/PortfolioHero'
import AllocationStudio, {
  type BucketRow,
  type RebalanceSuggestion,
} from '@/components/portfolio/AllocationStudio'
import ProjectionLab, { type ProjectionForm } from '@/components/portfolio/ProjectionLab'
import ProjectionResults from '@/components/portfolio/ProjectionResults'
import PortfolioExplainabilityCard from '@/components/portfolio/PortfolioExplainabilityCard'
import LoadingScreen from '@/components/ui/LoadingScreen'
import Reveal from '@/components/motion/Reveal'
import { AlertTriangle, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { safeNumber } from '@/lib/formatters'
import {
  ASSET_CLASS_MODEL,
  BUCKETS,
  blendProfile,
  summariseCashflow,
  type AssetBucket,
  type Weights,
} from '@/lib/portfolioMath'

/** Fallback target mixes, mirroring the backend's defaults. */
const FALLBACK_TARGETS: Record<string, Record<AssetBucket, number>> = {
  Conservative: { equity: 20, debt: 60, gold: 10, liquid: 10 },
  Balanced: { equity: 50, debt: 30, gold: 10, liquid: 10 },
  Aggressive: { equity: 70, debt: 15, gold: 10, liquid: 5 },
}

const EMPTY_SUMS: Record<AssetBucket, number> = { equity: 0, debt: 0, gold: 0, liquid: 0 }

export default function PortfolioPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [loadingData, setLoadingData] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  /** Per-bucket rupee totals, summed directly from the user's holdings. */
  const [bucketSums, setBucketSums] = useState<Record<AssetBucket, number>>(EMPTY_SUMS)
  const [holdingsCount, setHoldingsCount] = useState(0)
  const [targetAllocation, setTargetAllocation] = useState<Record<AssetBucket, number> | null>(null)
  const [suggestions, setSuggestions] = useState<RebalanceSuggestion[]>([])
  const [cashflow, setCashflow] = useState(summariseCashflow(null))

  const [simulation, setSimulation] = useState<any>(null)
  const [simulationParams, setSimulationParams] = useState<{
    initialAmount: number
    monthlyContribution: number
    years: number
    expectedReturn: number
  } | null>(null)
  const [running, setRunning] = useState(false)
  const [simError, setSimError] = useState<string | null>(null)

  const [form, setForm] = useState<ProjectionForm>({
    initialAmount: '0',
    monthlyContribution: '0',
    years: '10',
    expectedReturn: '10.0',
    volatility: '12.0',
  })

  /** Prefill from real data only once, so a manual edit survives a refresh. */
  const prefilled = useRef(false)

  /* ================= AUTH ================= */
  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  /* ================= DERIVED VALUES ================= */
  const totalValue = useMemo(
    () => BUCKETS.reduce((sum, b) => sum + bucketSums[b], 0),
    [bucketSums]
  )

  /** Exact weights (%) straight from the rupee sums — never double counted. */
  const weightsPct = useMemo(() => {
    const out = {} as Weights
    BUCKETS.forEach((b) => {
      out[b] = totalValue > 0 ? (bucketSums[b] / totalValue) * 100 : 0
    })
    return out
  }, [bucketSums, totalValue])

  const profile = useMemo(() => blendProfile(weightsPct), [weightsPct])

  const target = useMemo(
    () => targetAllocation ?? FALLBACK_TARGETS[profile.riskLevel] ?? FALLBACK_TARGETS.Balanced,
    [targetAllocation, profile.riskLevel]
  )

  const bucketRows: BucketRow[] = useMemo(
    () =>
      BUCKETS.map((bucket) => {
        const currentPct = weightsPct[bucket]
        const targetPct = safeNumber(target[bucket], 0)
        return {
          bucket,
          label: ASSET_CLASS_MODEL[bucket].label,
          color: ASSET_CLASS_MODEL[bucket].color,
          value: bucketSums[bucket],
          currentPct,
          targetPct,
          drift: currentPct - targetPct,
        }
      }),
    [weightsPct, target, bucketSums]
  )

  const investedValue = bucketSums.equity + bucketSums.debt + bucketSums.gold
  const liquidValue = bucketSums.liquid

  /* ================= DATA LOADING ================= */
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    setLoadError(null)

    const [holdingsRes, analysisRes, txRes] = await Promise.allSettled([
      api.get('/portfolio/holdings'),
      api.get('/portfolio/analysis'),
      api.get('/transactions', { params: { limit: 500 } }),
    ])

    // --- Holdings: the single source of truth for portfolio value.
    // /portfolio/holdings already includes savings accounts, so savings must NOT be added again.
    if (holdingsRes.status === 'fulfilled') {
      const items: any[] = Array.isArray(holdingsRes.value.data?.holdings)
        ? holdingsRes.value.data.holdings
        : []

      const sums = { ...EMPTY_SUMS }
      for (const item of items) {
        const bucket = (item?.assetClass ?? 'equity') as AssetBucket
        const value = safeNumber(item?.value, 0)
        if (BUCKETS.includes(bucket)) sums[bucket] += value
      }

      setBucketSums(sums)
      setHoldingsCount(items.length)
    } else {
      setLoadError('Could not load your holdings. Values shown may be incomplete.')
    }

    // --- Analysis: target mix and rebalancing actions.
    if (analysisRes.status === 'fulfilled') {
      const data = analysisRes.value.data
      const ta = data?.targetAllocation
      if (ta) {
        setTargetAllocation({
          equity: safeNumber(ta.equity, 0),
          debt: safeNumber(ta.debt, 0),
          gold: safeNumber(ta.gold, 0),
          liquid: safeNumber(ta.liquid, 0),
        })
      }
      const raw = data?.rebalance?.suggestions
      setSuggestions(
        Array.isArray(raw)
          ? raw
              .filter((s: any) => safeNumber(s?.amount, 0) > 0)
              .map((s: any) => ({
                action: s.action === 'sell' ? 'sell' : 'buy',
                bucket: String(s.bucket),
                amount: safeNumber(s.amount, 0),
              }))
          : []
      )
    }

    // --- Transactions: real monthly investable surplus.
    if (txRes.status === 'fulfilled') {
      setCashflow(summariseCashflow(txRes.value.data?.transactions))
    }

    setLastUpdated(new Date())
    setLoadingData(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    if (user) loadData()
  }, [user, loadData])

  /* ================= PREFILL FROM REAL DATA ================= */
  const applyMyData = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      initialAmount: String(Math.round(totalValue)),
      monthlyContribution: String(Math.max(0, Math.round(cashflow.monthlySurplus))),
      expectedReturn: (profile.expectedReturn * 100).toFixed(1),
      volatility: (profile.volatility * 100).toFixed(1),
    }))
  }, [totalValue, cashflow.monthlySurplus, profile])

  useEffect(() => {
    if (loadingData || prefilled.current) return
    prefilled.current = true
    applyMyData()
  }, [loadingData, applyMyData])

  /* ================= SIMULATION ================= */
  const handleChange = (patch: Partial<ProjectionForm>) =>
    setForm((prev) => ({ ...prev, ...patch }))

  const runSimulation = async () => {
    const initialAmount = Math.max(0, safeNumber(form.initialAmount, 0))
    const monthlyContribution = Math.max(0, safeNumber(form.monthlyContribution, 0))
    const years = Math.max(1, Math.min(40, Math.round(safeNumber(form.years, 10))))
    const expectedReturn = safeNumber(form.expectedReturn, 0) / 100
    const volatility = Math.max(0, safeNumber(form.volatility, 0)) / 100

    if (initialAmount <= 0 && monthlyContribution <= 0) {
      setSimError('Add a starting amount or a monthly contribution before running a projection.')
      return
    }

    setRunning(true)
    setSimError(null)

    try {
      const res = await api.post('/portfolio/simulation', {
        initialAmount,
        monthlyContribution,
        years,
        expectedReturn,
        volatility,
      })

      setSimulation(res.data)
      setSimulationParams({ initialAmount, monthlyContribution, years, expectedReturn })
    } catch (err) {
      console.error('Simulation failed:', err)
      setSimError('The projection engine did not respond. Please try again in a moment.')
    } finally {
      setRunning(false)
    }
  }

  /* ================= LOADING STATES ================= */
  if (loading || !user) {
    return <LoadingScreen label="Loading your portfolio..." />
  }

  if (loadingData) {
    return (
      <DashboardLayout>
        <PageBackground variant="grid" />
        <div className="relative z-10 space-y-6 lg:space-y-8" role="status" aria-live="polite">
          <span className="sr-only">Loading your portfolio...</span>
          <div className="pf-skeleton h-[22rem] w-full rounded-[1.5rem] sm:h-80" />
          <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <div className="pf-skeleton h-96 w-full rounded-[1.25rem]" />
            <div className="pf-skeleton h-96 w-full rounded-[1.25rem]" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  /* ================= UI ================= */
  return (
    <DashboardLayout>
      <PageBackground variant="grid" />

      <div className="relative z-10 space-y-6 lg:space-y-8">
        {loadError && (
          <div
            role="alert"
            className="pf-rise flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <span className="icon-tile icon-tile-sm icon-tile-amber">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <p className="text-sm text-amber-800">{loadError}</p>
          </div>
        )}

        <Reveal variant="rise">
          <PortfolioHero
            totalValue={totalValue}
            investedValue={investedValue}
            liquidValue={liquidValue}
            holdingsCount={holdingsCount}
            profile={profile}
            monthlySurplus={cashflow.monthlySurplus}
            savingsRate={cashflow.savingsRate}
            cashflowMonths={cashflow.months}
            lastUpdated={lastUpdated}
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
          />
        </Reveal>

        {/* ---------- Allocation + projection inputs ---------- */}
        <Reveal className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <AllocationStudio
            rows={bucketRows}
            totalValue={totalValue}
            profile={profile}
            suggestions={suggestions}
          />

          <ProjectionLab
            form={form}
            onChange={handleChange}
            onRun={runSimulation}
            onResetToMyData={applyMyData}
            running={running}
            derived={{
              portfolioValue: totalValue,
              monthlySurplus: cashflow.monthlySurplus,
              profile,
              hasCashflow: cashflow.hasData,
            }}
          />
        </Reveal>

        {simError && (
          <div
            role="alert"
            className="pf-rise flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <span className="icon-tile icon-tile-sm icon-tile-rose">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <p className="text-sm text-rose-700">{simError}</p>
          </div>
        )}

        {/* ---------- Results ---------- */}
        {simulation && simulationParams ? (
          <ProjectionResults sim={simulation} params={simulationParams} />
        ) : (
          <div className="pf-panel pf-rise flex flex-col items-center justify-center px-6 py-12 text-center sm:py-14">
            <div className="relative mb-4">
              <div aria-hidden="true" className="absolute inset-0 rounded-2xl bg-primary-200/60 blur-xl" />
              <span className="pf-orbit icon-tile icon-tile-lg icon-tile-brand relative">
                <Sparkles className="h-6 w-6" />
              </span>
            </div>
            <p className="font-display text-base font-semibold text-ink-900">Run a projection to see your outcome range</p>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">
              The Projection Lab is already seeded with your portfolio value, your average monthly surplus and the
              return your current asset mix implies. Hit Run Simulation to model 10,000 possible futures.
            </p>
          </div>
        )}

        {/* ---------- AI explainability ---------- */}
        <Reveal delay={90}>
          <PortfolioExplainabilityCard />
        </Reveal>
      </div>
    </DashboardLayout>
  )
}
