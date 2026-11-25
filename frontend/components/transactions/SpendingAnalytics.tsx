'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
  Cell
} from 'recharts'
import {
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'
import { ChartTooltipCard } from '@/components/ui/ChartTooltip'
import {
  chartColors,
  chartPalette,
  axisProps,
  axisTick,
  gridProps,
  tooltipCursor,
  barCursor,
  activeDot,
} from '@/lib/chartTheme'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface SpendingAnalyticsProps {
  refreshKey?: number
}

export default function SpendingAnalytics({ refreshKey = 0 }: SpendingAnalyticsProps) {
  const [breakdown, setBreakdown] = useState<any[]>([])
  const [trend, setTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeChart, setActiveChart] = useState<'both' | 'category' | 'trend'>('both')
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await api.get('/transactions/analytics/spending')
        setBreakdown(res.data.categoryBreakdown || [])
        setTrend(res.data.monthlyTrend || [])
      } catch (e) {
        console.error('Failed to load spending analytics', e)
        setBreakdown([])
        setTrend([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [refreshKey])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Chart 1: Category Breakdown Bar Chart */}
        <div className="card card-pad relative overflow-hidden">
          <SectionHeader
            as="h3"
            icon={BarChart3}
            tone="brand"
            title="Category Outflow Velocity"
            subtitle="Total expense distribution by domain"
            className="mb-5"
            actions={<span className="badge badge-neutral num">{breakdown.length} Categories</span>}
          />

          {loading ? (
            <div className="skeleton h-56 w-full sm:h-64" />
          ) : breakdown.length === 0 ? (
            <div className="flex h-56 items-center justify-center sm:h-64">
              <EmptyState compact icon={BarChart3} tone="slate" title="No category breakdown data available yet." />
            </div>
          ) : (
            <div className="h-56 w-full pt-1 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis
                    dataKey="category"
                    {...axisProps}
                    tick={{ ...axisTick, fontSize: 10 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    {...axisProps}
                    tick={{ ...axisTick, fontSize: 10 }}
                    tickFormatter={(val) =>
                      val >= 100000 ? `₹${(val / 100000).toFixed(0)}L` : val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`
                    }
                  />
                  <Tooltip
                    cursor={barCursor}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <ChartTooltipCard
                            title={<span className="capitalize">{label}</span>}
                            rows={[
                              {
                                label: 'Total',
                                value: `₹${Number(payload[0]?.value || 0).toLocaleString('en-IN')}`,
                                color: chartColors.negative,
                              },
                            ]}
                          />
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={44} isAnimationActive={!reduceMotion}>
                    {breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartPalette[index % chartPalette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Monthly Inflow vs Outflow Waveform Area Chart */}
        <div className="card card-pad relative overflow-hidden">
          <SectionHeader
            as="h3"
            icon={TrendingUp}
            tone="cyan"
            title="Inflow vs Outflow Rhythm"
            subtitle="Monthly cash delta timeline"
            className="mb-5"
            actions={
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Income
                </span>
                <span className="flex items-center gap-1.5 font-medium text-rose-300">
                  <span className="h-2 w-2 rounded-full bg-rose-400" /> Expense
                </span>
              </div>
            }
          />

          {loading ? (
            <div className="skeleton h-56 w-full sm:h-64" />
          ) : trend.length === 0 ? (
            <div className="flex h-56 items-center justify-center sm:h-64">
              <EmptyState compact icon={TrendingUp} tone="slate" title="No monthly trend data recorded yet." />
            </div>
          ) : (
            <div className="h-56 w-full pt-1 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.positive} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={chartColors.positive} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.negative} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={chartColors.negative} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="month" {...axisProps} />
                  <YAxis
                    {...axisProps}
                    tick={{ ...axisTick, fontSize: 10 }}
                    tickFormatter={(val) =>
                      val >= 100000 ? `₹${(val / 100000).toFixed(0)}L` : val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`
                    }
                  />
                  <Tooltip
                    cursor={tooltipCursor}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <ChartTooltipCard
                            title={label}
                            rows={[
                              {
                                label: 'Income',
                                value: `₹${Number(payload[0]?.value || 0).toLocaleString('en-IN')}`,
                                color: chartColors.positive,
                              },
                              {
                                label: 'Expense',
                                value: `₹${Number(payload[1]?.value || 0).toLocaleString('en-IN')}`,
                                color: chartColors.negative,
                              },
                            ]}
                          />
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke={chartColors.positive}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#incomeWave)"
                    activeDot={{ ...activeDot, fill: chartColors.positive }}
                    isAnimationActive={!reduceMotion}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke={chartColors.negative}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#expenseWave)"
                    activeDot={{ ...activeDot, fill: chartColors.negative }}
                    isAnimationActive={!reduceMotion}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
