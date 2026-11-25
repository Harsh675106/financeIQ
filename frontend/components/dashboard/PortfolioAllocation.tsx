'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, Shield, PieChart as PieIcon, Sparkles } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { chartColors, chartPalette } from '@/lib/chartTheme'
import { ChartTooltipCard } from '@/components/ui/ChartTooltip'
import SectionHeader from '@/components/ui/SectionHeader'
import EmptyState from '@/components/ui/EmptyState'

interface PortfolioData {
  riskLevel: string
  riskScore: number
  volatility: number
  totalValue: number
  currentAllocation: {
    equity: number
    debt: number
    gold: number
    liquid: number
  }
  targetAllocation: {
    equity: number
    debt: number
    gold: number
    liquid: number
  }
  recommendation: string
}

const COLORS = {
  equity: chartPalette[0], // emerald
  debt: chartPalette[1], // ice blue
  gold: chartPalette[3], // amber
  liquid: chartPalette[2], // indigo
}

// Custom Tooltip for Pie Chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return <ChartTooltipCard rows={[{ label: data.name, value: `${data.value}%`, color: data.payload.color }]} />
  }
  return null
}

export default function PortfolioAllocation() {
  const [data, setData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const reduceMotion = useReducedMotion()

  const fetchPortfolioData = async () => {
    try {
      const response = await api.get('/portfolio/allocation')
      setData(response.data)
    } catch (error: any) {
      console.error('Failed to fetch portfolio data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolioData()
  }, [])

  const totalVal = data?.totalValue || 0
  const animatedTotal = useCountUp(totalVal, { duration: 1000 })

  if (loading) {
    return (
      <div className="card card-pad" aria-busy="true">
        <div className="mb-5 flex items-center gap-3">
          <div className="skeleton h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/3 max-w-[12rem]" />
            <div className="skeleton h-3 w-1/2 max-w-[16rem]" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="skeleton mx-auto aspect-square w-48 rounded-full" />
          <div className="grid grid-cols-1 content-center gap-2.5 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-14" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const chartData = data?.currentAllocation
    ? [
        { name: 'Equity', value: data.currentAllocation.equity, color: COLORS.equity },
        { name: 'Debt & Bonds', value: data.currentAllocation.debt, color: COLORS.debt },
        { name: 'Gold & Commodities', value: data.currentAllocation.gold, color: COLORS.gold },
        { name: 'Liquid & Cash', value: data.currentAllocation.liquid, color: COLORS.liquid },
      ].filter((item) => item.value > 0)
    : []

  return (
    <div className="card card-pad card-spotlight group animate-fade-up">
      {/* Header */}
      <SectionHeader
        icon={PieIcon}
        tone="brand"
        title="Portfolio Allocation"
        subtitle="Asset class distribution"
        className="relative mb-5"
        actions={
          data?.riskLevel ? <span className="badge badge-brand">{data.riskLevel} Strategy</span> : undefined
        }
      />

      {chartData.length > 0 && data && data.totalValue > 0 ? (
        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center lg:gap-8">
          {/* Donut Chart with Center Summary */}
          <div className="relative flex h-56 w-full items-center justify-center sm:h-64">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[7.5rem] w-[7.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary-50 via-white to-ice-50"
            />
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={86}
                  paddingAngle={4}
                  cornerRadius={4}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  isAnimationActive={!reduceMotion}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={chartColors.surface}
                      strokeWidth={3}
                      className="cursor-pointer transition-all duration-300"
                      style={{
                        transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Hole Total Value */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="eyebrow text-[10px] text-slate-500">Total Value</span>
              <span className="kpi-value mt-0.5 max-w-[7.5rem] text-base [overflow-wrap:anywhere] sm:text-lg">
                ₹{animatedTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            {/* Asset Pills Grid */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {chartData.map((item, index) => (
                <div
                  key={index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`surface-inset cursor-pointer p-3 transition-[transform,border-color,background-color] duration-200 ${
                    activeIndex === index
                      ? 'border-primary-200 bg-white shadow-card motion-safe:scale-[1.02]'
                      : 'hover:border-line-strong hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color, boxShadow: `0 0 0 3px ${item.color}22` }}
                      />
                      <span className="truncate text-xs font-semibold text-ink-800">{item.name}</span>
                    </div>
                    <span className="num shrink-0 text-xs font-bold text-ink-900">{item.value}%</span>
                  </div>
                  <div className="progress-track mt-2.5 h-1" aria-hidden="true">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, item.value))}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Recommendation Alert */}
            {data?.recommendation && (
              <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5">
                <span className="icon-tile icon-tile-sm icon-tile-violet">
                  <Shield className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-indigo-700">Rebalancing Intelligence</p>
                  <p className="mt-0.5 break-words text-[11px] leading-relaxed text-slate-600">
                    {data.recommendation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          compact
          icon={PieIcon}
          tone="slate"
          title="Add assets and savings to generate portfolio distribution"
          className="relative"
        />
      )}
    </div>
  )
}
