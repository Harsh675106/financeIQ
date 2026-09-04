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
      <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-xl animate-pop-in">
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <p className="text-sm font-bold text-slate-50">{formatFullRupees(value)}</p>
        </div>
      </div>
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
    <div className="card card-pad card-spotlight group animate-fade-up">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 icon-morph-container">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-50">Net Worth Trajectory</h2>
            <p className="text-xs text-slate-400">
              Current: <span className="font-semibold text-emerald-400">₹{animatedNetWorth.toLocaleString('en-IN')}</span>
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto rounded-xl border border-slate-800 bg-slate-950/70 p-1">
          <button
            onClick={() => setChartType('area')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              chartType === 'area'
                ? 'bg-primary-500/20 text-primary-300 shadow-sm ring-1 ring-primary-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              chartType === 'line'
                ? 'bg-primary-500/20 text-primary-300 shadow-sm ring-1 ring-primary-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Line
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-xl bg-slate-800/50 animate-pulse flex items-center justify-center">
          <Activity className="h-6 w-6 text-slate-600 animate-spin" />
        </div>
      ) : trend.length === 0 ? (
        <div className="py-14 text-center text-slate-400">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/60 mb-2">
            <TrendingUp className="h-6 w-6 text-slate-500" />
          </div>
          <p className="text-sm">Track net worth progression over time</p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={75}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatCompactRupees(Number(value))}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#netWorthGradient)"
                  isAnimationActive={true}
                  animationDuration={1200}
                />
              </AreaChart>
            ) : (
              <LineChart data={trend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={75}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatCompactRupees(Number(value))}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981', strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#34d399', stroke: '#020617', strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={1200}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
