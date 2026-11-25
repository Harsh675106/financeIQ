'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Banknote,
  Coins,
  Flame,
  Gauge,
  Info,
  LineChart as LineIcon,
  Percent,
  Shield,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { formatINR } from '@/lib/formatters'
import { activeDot, axisProps, chartColors, gridProps, tooltipCursor } from '@/lib/chartTheme'
import { ChartTooltipCard } from '@/components/ui/ChartTooltip'
import {
  INFLATION_ASSUMPTION,
  compactINR,
  percentileLadder,
  probabilityOfAtLeast,
  projectExpectedPath,
  solveAnnualisedReturn,
  toRealValue,
  totalCapitalDeployed,
} from '@/lib/portfolioMath'

interface Props {
  sim: any
  /** The exact inputs the simulation was run with. */
  params: {
    initialAmount: number
    monthlyContribution: number
    years: number
    expectedReturn: number
  }
}

const LADDER_META: Record<number, { label: string; hint: string; color: string }> = {
  0: { label: 'Minimum', hint: 'Worst single path observed', color: chartColors.negative },
  5: { label: '5th percentile', hint: '95% of paths finish above this', color: chartColors.warning },
  25: { label: '25th percentile', hint: 'Lower quartile outcome', color: chartColors.lime },
  50: { label: 'Median', hint: 'Even odds above or below', color: chartColors.positive },
  75: { label: '75th percentile', hint: 'Upper quartile outcome', color: chartColors.cyan },
  95: { label: '95th percentile', hint: 'Only 5% of paths beat this', color: chartColors.brand },
  100: { label: 'Maximum', hint: 'Best single path observed', color: chartColors.violet },
}

/** Series colours: what you put in (info) vs what compounding adds on top (gain). */
const CONTRIBUTED_COLOR = chartColors.cyan
const GROWTH_COLOR = chartColors.positive

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const contributed = payload.find((p: any) => p.dataKey === 'contributed')?.value ?? 0
  const growth = payload.find((p: any) => p.dataKey === 'growth')?.value ?? 0

  return (
    <ChartTooltipCard
      title={`Year ${label}`}
      rows={[
        { label: 'Contributed', value: `₹${formatINR(contributed)}`, color: CONTRIBUTED_COLOR },
        { label: 'Compound growth', value: `₹${formatINR(growth)}`, color: GROWTH_COLOR },
      ]}
      footer={
        <span className="flex items-center justify-between gap-4">
          <span>Total</span>
          <span className="num text-sm font-semibold text-white">₹{formatINR(contributed + growth)}</span>
        </span>
      }
    />
  )
}

interface StatProps {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  accent: string
  tone: string
  delay: number
}

function Stat({ label, value, sub, icon, accent, tone, delay }: StatProps) {
  return (
    <div className="pf-tile pf-rise min-w-0 p-4 sm:p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-2">
        <p className="eyebrow min-w-0 truncate">{label}</p>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            color: accent,
            background: `radial-gradient(120% 120% at 30% 0%, rgba(255,255,255,0.1), transparent 60%), linear-gradient(145deg, ${accent}40, ${accent}10)`,
            boxShadow: `inset 0 0 0 1px ${accent}4d, inset 0 1px 0 0 rgba(255,255,255,0.1), 0 8px 20px -10px ${accent}99`,
          }}
        >
          {icon}
        </span>
      </div>
      <p className={`kpi-value mt-2 truncate text-xl sm:text-2xl ${tone}`}>{value}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{sub}</p>
      <span className="pf-tile-accent" style={{ backgroundColor: accent }} />
    </div>
  )
}

export default function ProjectionResults({ sim, params }: Props) {
  const { initialAmount, monthlyContribution, years, expectedReturn } = params
  const reduceMotion = useReducedMotion()

  const ladder = useMemo(() => percentileLadder(sim), [sim])
  const path = useMemo(
    () => projectExpectedPath(initialAmount, monthlyContribution, years, expectedReturn),
    [initialAmount, monthlyContribution, years, expectedReturn]
  )

  const invested = totalCapitalDeployed(initialAmount, monthlyContribution, years)
  const median = Number(sim?.median) || 0
  const gain = median - invested
  const annualised = solveAnnualisedReturn(initialAmount, monthlyContribution, years, median)
  const realValue = toRealValue(median, years)

  const probBeatInvested = probabilityOfAtLeast(ladder, invested)
  const probDouble = probabilityOfAtLeast(ladder, invested * 2)

  const animatedMedian = useCountUp(median, { duration: 1300 })
  const animatedGain = useCountUp(gain, { duration: 1300 })

  const ladderMax = ladder.length ? Math.max(...ladder.map((p) => p.value)) : 0

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ================= HEADLINE STATS ================= */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Stat
          label="Projected Median"
          value={`₹${formatINR(animatedMedian)}`}
          sub={`Middle outcome after ${years} year${years === 1 ? '' : 's'}`}
          icon={<Target className="h-4 w-4" />}
          accent={chartColors.brand}
          tone="text-primary-200"
          delay={0}
        />
        <Stat
          label="Capital Invested"
          value={compactINR(invested)}
          sub={`₹${formatINR(initialAmount)} start + ₹${formatINR(monthlyContribution)}/mo × ${years * 12} months`}
          icon={<Banknote className="h-4 w-4" />}
          accent={CONTRIBUTED_COLOR}
          tone="text-cyan-300"
          delay={70}
        />
        <Stat
          label="Compound Gain"
          value={`${gain < 0 ? '-' : '+'}₹${formatINR(Math.abs(animatedGain))}`}
          sub={
            invested > 0
              ? `${(median / invested).toFixed(2)}× your invested capital`
              : 'Add capital to project growth'
          }
          icon={<Flame className="h-4 w-4" />}
          accent={gain >= 0 ? chartColors.positive : chartColors.negative}
          tone={gain >= 0 ? 'text-emerald-300' : 'text-rose-300'}
          delay={140}
        />
        <Stat
          label="Annualised Return"
          value={`${(annualised * 100).toFixed(2)}%`}
          sub="Money-weighted across every contribution"
          icon={<Percent className="h-4 w-4" />}
          accent={chartColors.violet}
          tone="text-violet-300"
          delay={210}
        />
      </div>

      {/* ================= GROWTH PATH ================= */}
      <div className="pf-panel pf-rise p-5 sm:p-6" style={{ animationDelay: '80ms' }}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="pf-orbit icon-tile icon-tile-brand icon-morph-container">
              <LineIcon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title truncate">Growth Path</h3>
              <p className="card-subtitle">Your money in vs compounding on top</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: CONTRIBUTED_COLOR, boxShadow: `0 0 8px ${CONTRIBUTED_COLOR}` }}
              />{' '}
              Contributed
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: GROWTH_COLOR, boxShadow: `0 0 8px ${GROWTH_COLOR}` }}
              />{' '}
              Growth
            </span>
          </div>
        </div>

        <div className="h-60 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={path} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pfContributed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CONTRIBUTED_COLOR} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={CONTRIBUTED_COLOR} stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="pfGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GROWTH_COLOR} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={GROWTH_COLOR} stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid {...gridProps} />
              <XAxis {...axisProps} dataKey="year" tickFormatter={(y) => `${y}y`} />
              <YAxis {...axisProps} width={62} tickFormatter={(v) => compactINR(v)} />
              <Tooltip content={<ChartTooltip />} cursor={tooltipCursor} />

              <Area
                type="monotone"
                dataKey="contributed"
                stackId="1"
                stroke={CONTRIBUTED_COLOR}
                strokeWidth={2}
                fill="url(#pfContributed)"
                activeDot={{ ...activeDot, fill: CONTRIBUTED_COLOR }}
                isAnimationActive={!reduceMotion}
                animationDuration={1100}
              />
              <Area
                type="monotone"
                dataKey="growth"
                stackId="1"
                stroke={GROWTH_COLOR}
                strokeWidth={2}
                fill="url(#pfGrowth)"
                activeDot={{ ...activeDot, fill: GROWTH_COLOR }}
                isAnimationActive={!reduceMotion}
                animationDuration={1100}
                animationBegin={180}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
          <Info className="mt-0.5 h-3 w-3 shrink-0 text-cyan-300/80" />
          This is the expected path with volatility switched off — the centre line of the same model. Contributions
          compound monthly at {(expectedReturn * 100).toFixed(1)}% a year. The spread of real outcomes is below.
        </p>
      </div>

      {/* ================= OUTCOME DISTRIBUTION ================= */}
      <div className="pf-panel pf-rise p-5 sm:p-6" style={{ animationDelay: '140ms' }}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="pf-orbit icon-tile icon-tile-cyan icon-morph-container">
              <Gauge className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <h3 className="card-title truncate">Outcome Distribution</h3>
              <p className="card-subtitle">
                Across {(sim?.simulations ?? 10000).toLocaleString('en-IN')} simulated paths
              </p>
            </div>
          </div>

          <span className="badge badge-neutral num self-start px-3 py-1 sm:self-auto">
            <TrendingUp className="h-3.5 w-3.5" />
            σ ₹{formatINR(sim?.stdDev)}
          </span>
        </div>

        <div className="space-y-2">
          {ladder.map((point, i) => {
            const meta = LADDER_META[point.percentile]
            const width = ladderMax > 0 ? (point.value / ladderMax) * 100 : 0
            const isMedian = point.percentile === 50

            return (
              <div
                key={point.percentile}
                className={`pf-ladder-row surface-inset p-2.5 sm:p-3 ${
                  isMedian
                    ? 'border-primary-400/40 bg-primary-500/[0.08] shadow-[0_0_24px_-12px_rgba(112,104,244,0.6)]'
                    : 'surface-inset-hover'
                }`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color, boxShadow: `0 0 8px ${meta.color}99` }}
                    />
                    <span
                      className={`shrink-0 text-xs font-semibold ${isMedian ? 'text-primary-100' : 'text-slate-300'}`}
                    >
                      {meta.label}
                    </span>
                    <span className="hidden truncate text-[11px] text-slate-500 sm:inline">· {meta.hint}</span>
                  </div>
                  <span
                    className="num shrink-0 font-display text-sm font-semibold"
                    style={{ color: isMedian ? '#6ee7b7' : '#eef0f8' }}
                  >
                    ₹{formatINR(point.value)}
                  </span>
                </div>

                <div className="mt-2 h-1.5 rounded-full bg-white/[0.06]">
                  <div
                    className="pf-bar h-full"
                    style={{
                      width: `${width}%`,
                      backgroundImage: `linear-gradient(90deg, ${meta.color}80, ${meta.color})`,
                      backgroundColor: meta.color,
                      animationDelay: `${200 + i * 70}ms`,
                      boxShadow: `0 0 10px -2px ${meta.color}aa`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ================= INSIGHTS ================= */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Stat
          label="Today's Money"
          value={compactINR(realValue)}
          sub={`Median buying power after ${(INFLATION_ASSUMPTION * 100).toFixed(0)}% yearly inflation`}
          icon={<Coins className="h-4 w-4" />}
          accent={chartColors.warning}
          tone="text-amber-300"
          delay={0}
        />
        <Stat
          label="Beats Capital"
          value={probBeatInvested === null ? '—' : `${probBeatInvested}%`}
          sub="Chance of finishing above what you put in"
          icon={<Shield className="h-4 w-4" />}
          accent={chartColors.positive}
          tone="text-emerald-300"
          delay={70}
        />
        <Stat
          label="Doubles Capital"
          value={probDouble === null ? '—' : `${probDouble}%`}
          sub="Chance of at least 2× your invested capital"
          icon={<TrendingUp className="h-4 w-4" />}
          accent={chartColors.cyan}
          tone="text-cyan-300"
          delay={140}
        />
        <Stat
          label="Downside Case"
          value={compactINR(sim?.percentile5 ?? sim?.worstCase)}
          sub={
            invested > 0
              ? `Bottom 5% still returns ${(((Number(sim?.percentile5 ?? sim?.worstCase) || 0) / invested) * 100).toFixed(0)}% of capital`
              : 'Weakest 5% of outcomes'
          }
          icon={<Shield className="h-4 w-4" />}
          accent={chartColors.negative}
          tone="text-rose-300"
          delay={210}
        />
      </div>

      {/* ================= READING GUIDE ================= */}
      <div className="pf-panel pf-rise border-cyan-400/15 p-5 sm:p-6" style={{ animationDelay: '200ms' }}>
        <div className="mb-3 flex items-center gap-2.5">
          <span className="icon-tile icon-tile-sm icon-tile-cyan">
            <Info className="h-4 w-4" />
          </span>
          <h4 className="font-display text-sm font-semibold text-slate-100">How to read this</h4>
        </div>
        <ul className="grid gap-x-6 gap-y-2.5 text-xs leading-relaxed text-slate-400 sm:grid-cols-2">
          <li>
            <strong className="font-semibold text-slate-200">Percentiles</strong> come from running the full horizon{' '}
            {(sim?.simulations ?? 10000).toLocaleString('en-IN')} times with random monthly shocks, then sorting the
            final balances.
          </li>
          <li>
            <strong className="font-semibold text-slate-200">Median beats mean</strong> as a planning number — the mean is dragged
            upward by a handful of extreme winning paths.
          </li>
          <li>
            <strong className="font-semibold text-slate-200">5th–95th percentile</strong> is the band that contains 90% of outcomes.
            Minimum and maximum are single extreme paths and should not anchor a plan.
          </li>
          <li>
            <strong className="font-semibold text-slate-200">Probabilities</strong> are interpolated from that simulated ladder, so
            treat them as close estimates rather than exact odds.
          </li>
        </ul>
      </div>
    </div>
  )
}
