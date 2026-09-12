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
import { formatINR } from '@/lib/formatters'
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
  0: { label: 'Minimum', hint: 'Worst single path observed', color: '#f87171' },
  5: { label: '5th percentile', hint: '95% of paths finish above this', color: '#fbbf24' },
  25: { label: '25th percentile', hint: 'Lower quartile outcome', color: '#a3e635' },
  50: { label: 'Median', hint: 'Even odds above or below', color: '#34d399' },
  75: { label: '75th percentile', hint: 'Upper quartile outcome', color: '#22d3ee' },
  95: { label: '95th percentile', hint: 'Only 5% of paths beat this', color: '#818cf8' },
  100: { label: 'Maximum', hint: 'Best single path observed', color: '#c084fc' },
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const contributed = payload.find((p: any) => p.dataKey === 'contributed')?.value ?? 0
  const growth = payload.find((p: any) => p.dataKey === 'growth')?.value ?? 0

  return (
    <div className="animate-pop-in rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 shadow-xl backdrop-blur-xl">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Year {label}
      </p>
      <p className="text-sm font-extrabold text-slate-50">₹{formatINR(contributed + growth)}</p>
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-sky-400" /> Contributed
          </span>
          <span className="font-semibold text-slate-200">₹{formatINR(contributed)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-primary-400" /> Compound growth
          </span>
          <span className="font-semibold text-primary-300">₹{formatINR(growth)}</span>
        </div>
      </div>
    </div>
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
    <div className="pf-tile pf-rise p-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}1f`, color: accent }}
        >
          {icon}
        </span>
      </div>
      <p className={`mt-1.5 text-xl font-extrabold ${tone}`}>{value}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{sub}</p>
      <span className="pf-tile-accent" style={{ backgroundColor: accent }} />
    </div>
  )
}

export default function ProjectionResults({ sim, params }: Props) {
  const { initialAmount, monthlyContribution, years, expectedReturn } = params

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
    <div className="space-y-5">
      {/* ================= HEADLINE STATS ================= */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Projected Median"
          value={`₹${formatINR(animatedMedian)}`}
          sub={`Middle outcome after ${years} year${years === 1 ? '' : 's'}`}
          icon={<Target className="h-3.5 w-3.5" />}
          accent="#34d399"
          tone="text-primary-300"
          delay={0}
        />
        <Stat
          label="Capital Invested"
          value={compactINR(invested)}
          sub={`₹${formatINR(initialAmount)} start + ₹${formatINR(monthlyContribution)}/mo × ${years * 12} months`}
          icon={<Banknote className="h-3.5 w-3.5" />}
          accent="#0ea5e9"
          tone="text-sky-300"
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
          icon={<Flame className="h-3.5 w-3.5" />}
          accent={gain >= 0 ? '#f59e0b' : '#f87171'}
          tone={gain >= 0 ? 'text-amber-300' : 'text-danger-300'}
          delay={140}
        />
        <Stat
          label="Annualised Return"
          value={`${(annualised * 100).toFixed(2)}%`}
          sub="Money-weighted across every contribution"
          icon={<Percent className="h-3.5 w-3.5" />}
          accent="#8b5cf6"
          tone="text-purple-300"
          delay={210}
        />
      </div>

      {/* ================= GROWTH PATH ================= */}
      <div className="pf-panel pf-rise p-5 sm:p-6" style={{ animationDelay: '80ms' }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="pf-orbit icon-morph-container flex h-9 w-9 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-500/10 text-primary-400">
              <LineIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-50">Growth Path</h3>
              <p className="text-xs text-slate-400">Your money in vs compounding on top</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-sky-400" /> Contributed
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-primary-400" /> Growth
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={path} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="pfContributed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.06} />
              </linearGradient>
              <linearGradient id="pfGrowth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.06} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 6" stroke="rgba(148,163,184,0.12)" vertical={false} />
            <XAxis
              dataKey="year"
              stroke="rgba(148,163,184,0.5)"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(148,163,184,0.15)' }}
              tickFormatter={(y) => `${y}y`}
            />
            <YAxis
              stroke="rgba(148,163,184,0.5)"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              width={62}
              tickFormatter={(v) => compactINR(v)}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(52,211,153,0.35)', strokeWidth: 1 }} />

            <Area
              type="monotone"
              dataKey="contributed"
              stackId="1"
              stroke="#0ea5e9"
              strokeWidth={2}
              fill="url(#pfContributed)"
              animationDuration={1100}
            />
            <Area
              type="monotone"
              dataKey="growth"
              stackId="1"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#pfGrowth)"
              animationDuration={1100}
              animationBegin={180}
            />
          </AreaChart>
        </ResponsiveContainer>

        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          This is the expected path with volatility switched off — the centre line of the same model. Contributions
          compound monthly at {(expectedReturn * 100).toFixed(1)}% a year. The spread of real outcomes is below.
        </p>
      </div>

      {/* ================= OUTCOME DISTRIBUTION ================= */}
      <div className="pf-panel pf-rise p-5 sm:p-6" style={{ animationDelay: '140ms' }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="pf-orbit icon-morph-container flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-50">Outcome Distribution</h3>
              <p className="text-xs text-slate-400">
                Across {(sim?.simulations ?? 10000).toLocaleString('en-IN')} simulated paths
              </p>
            </div>
          </div>

          <span className="chip bg-slate-900/70 text-slate-400 ring-1 ring-slate-800">
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
                className={`pf-ladder-row rounded-xl border p-2.5 transition-colors duration-200 ${
                  isMedian
                    ? 'border-primary-500/40 bg-primary-500/[0.07]'
                    : 'border-slate-800/60 bg-slate-950/40 hover:bg-slate-900/50'
                }`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span className={`text-xs font-bold ${isMedian ? 'text-primary-200' : 'text-slate-300'}`}>
                      {meta.label}
                    </span>
                    <span className="hidden truncate text-[11px] text-slate-500 sm:inline">· {meta.hint}</span>
                  </div>
                  <span
                    className="shrink-0 text-sm font-extrabold"
                    style={{ color: isMedian ? '#6ee7b7' : '#e2e8f0' }}
                  >
                    ₹{formatINR(point.value)}
                  </span>
                </div>

                <div className="mt-2 h-1.5 rounded-full bg-slate-800/70">
                  <div
                    className="pf-bar h-full"
                    style={{
                      width: `${width}%`,
                      backgroundColor: meta.color,
                      animationDelay: `${200 + i * 70}ms`,
                      boxShadow: `0 0 8px ${meta.color}66`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ================= INSIGHTS ================= */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Today's Money"
          value={compactINR(realValue)}
          sub={`Median buying power after ${(INFLATION_ASSUMPTION * 100).toFixed(0)}% yearly inflation`}
          icon={<Coins className="h-3.5 w-3.5" />}
          accent="#f59e0b"
          tone="text-amber-300"
          delay={0}
        />
        <Stat
          label="Beats Capital"
          value={probBeatInvested === null ? '—' : `${probBeatInvested}%`}
          sub="Chance of finishing above what you put in"
          icon={<Shield className="h-3.5 w-3.5" />}
          accent="#10b981"
          tone="text-primary-300"
          delay={70}
        />
        <Stat
          label="Doubles Capital"
          value={probDouble === null ? '—' : `${probDouble}%`}
          sub="Chance of at least 2× your invested capital"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          accent="#22d3ee"
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
          icon={<Shield className="h-3.5 w-3.5" />}
          accent="#fbbf24"
          tone="text-yellow-300"
          delay={210}
        />
      </div>

      {/* ================= READING GUIDE ================= */}
      <div className="pf-panel pf-rise border-cyan-500/20 p-4 sm:p-5" style={{ animationDelay: '200ms' }}>
        <div className="mb-2.5 flex items-center gap-2">
          <Info className="h-4 w-4 text-cyan-300" />
          <h4 className="text-sm font-bold text-slate-100">How to read this</h4>
        </div>
        <ul className="grid gap-2 text-[11px] leading-relaxed text-slate-400 sm:grid-cols-2">
          <li>
            <strong className="text-slate-300">Percentiles</strong> come from running the full horizon{' '}
            {(sim?.simulations ?? 10000).toLocaleString('en-IN')} times with random monthly shocks, then sorting the
            final balances.
          </li>
          <li>
            <strong className="text-slate-300">Median beats mean</strong> as a planning number — the mean is dragged
            upward by a handful of extreme winning paths.
          </li>
          <li>
            <strong className="text-slate-300">5th–95th percentile</strong> is the band that contains 90% of outcomes.
            Minimum and maximum are single extreme paths and should not anchor a plan.
          </li>
          <li>
            <strong className="text-slate-300">Probabilities</strong> are interpolated from that simulated ladder, so
            treat them as close estimates rather than exact odds.
          </li>
        </ul>
      </div>
    </div>
  )
}
