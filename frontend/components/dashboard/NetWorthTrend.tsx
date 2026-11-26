'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { TrendingUp, Sparkles, Activity, Maximize2 } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { chartColors, axisProps, gridProps, tooltipCursor, activeDot } from '@/lib/chartTheme'
import { ChartTooltipCard } from '@/components/ui/ChartTooltip'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'
import SectionSwap from '@/components/motion/SectionSwap'

interface TrendPoint {
  month: string
  netWorth: number
}

interface NetWorth {
  assetsTotal: number
  liabilitiesTotal: number
  current: number
  trend: TrendPoint[]
}

interface DashboardResponse {
  netWorth: NetWorth
}

function formatCompactRupees(value: number) {
  const absoluteValue = Math.abs(Number(value) || 0)
  const sign = value < 0 ? '-' : ''

  if (absoluteValue >= 10000000) {
    return `${sign}₹${(absoluteValue / 10000000).toFixed(1)}Cr`
  }

  if (absoluteValue >= 100000) {
    return `${sign}₹${(absoluteValue / 100000).toFixed(1)}L`
  }

  if (absoluteValue >= 1000) {
    return `${sign}₹${(absoluteValue / 1000).toFixed(1)}K`
  }

  return `${sign}₹${absoluteValue.toLocaleString('en-IN')}`
}

function formatFullRupees(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

// Custom Tooltip component with glassmorphism and glowing dot
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value
    return (
      <ChartTooltipCard
        title={label}
        rows={[{ label: 'Net worth', value: formatFullRupees(value), color: chartColors.brand }]}
      />
    )
  }
  return null
}

export default function NetWorthTrend() {
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [currentValue, setCurrentValue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState<'area' | 'line'>('area')
  const [timeRange, setTimeRange] = useState<'6M' | '1Y' | 'ALL'>('6M')
  const reduceMotion = useReducedMotion()

  const fetchData = async () => {
    try {
      const res = await api.get<DashboardResponse>('/analytics/dashboard')
      const trendData = res.data.netWorth?.trend || []
      setTrend(trendData)
      if (res.data.netWorth?.current) {
        setCurrentValue(res.data.netWorth.current)
      } else if (trendData.length > 0) {
        setCurrentValue(trendData[trendData.length - 1].netWorth)
      }
    } catch (e) {
      console.error('Failed to fetch net worth trend', e)
      setTrend([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 60000)
    return () => clearInterval(id)
  }, [])

  const animatedNetWorth = useCountUp(currentValue, { duration: 1000 })

  return (
    <div className="card card-pad card-spotlight group h-full animate-fade-up">
      {/* Header & Controls */}
      <SectionHeader
        icon={TrendingUp}
        tone="brand"
        title="Net Worth Trajectory"
        subtitle={
          <>
            Current:{' '}
            <span className="num font-display text-[13px] font-semibold text-ink-900">
              ₹{animatedNetWorth.toLocaleString('en-IN')}
            </span>
          </>
        }
        className="relative mb-5"
        actions={
          <div className="segmented" role="group" aria-label="Chart type">
            <button
              onClick={() => setChartType('area')}
              aria-pressed={chartType === 'area'}
              className={`segmented-item ${chartType === 'area' ? 'segmented-item-active' : ''}`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('line')}
              aria-pressed={chartType === 'line'}
              className={`segmented-item ${chartType === 'line' ? 'segmented-item-active' : ''}`}
            >
              Line
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="skeleton relative flex h-56 items-center justify-center sm:h-64" aria-busy="true">
          <Activity className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : trend.length === 0 ? (
        <EmptyState
          compact
          icon={TrendingUp}
          tone="slate"
          title="Track net worth progression over time"
          className="relative py-10"
        />
      ) : (
        <SectionSwap swapKey={chartType} mode="flip" className="relative h-56 w-full sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColors.brand} stopOpacity={0.28} />
                    <stop offset="55%" stopColor={chartColors.ice} stopOpacity={0.1} />
                    <stop offset="100%" stopColor={chartColors.ice} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis
                  width={75}
                  {...axisProps}
                  tickFormatter={(value) => formatCompactRupees(Number(value))}
                />
                <Tooltip content={<CustomTooltip />} cursor={tooltipCursor} />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke={chartColors.brandStrong}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#netWorthGradient)"
                  activeDot={activeDot}
                  isAnimationActive={!reduceMotion}
                  animationDuration={1200}
                />
              </AreaChart>
            ) : (
              <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis
                  width={75}
                  {...axisProps}
                  tickFormatter={(value) => formatCompactRupees(Number(value))}
                />
                <Tooltip content={<CustomTooltip />} cursor={tooltipCursor} />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke={chartColors.brandStrong}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: chartColors.brandStrong, strokeWidth: 1.5, stroke: chartColors.surface }}
                  activeDot={activeDot}
                  isAnimationActive={!reduceMotion}
                  animationDuration={1200}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </SectionSwap>
      )}
    </div>
  )
}
