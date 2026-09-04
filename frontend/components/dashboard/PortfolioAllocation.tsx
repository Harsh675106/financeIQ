'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, Shield, PieChart as PieIcon, Sparkles } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'

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
  equity: '#0ea5e9', // sky
  debt: '#10b981', // emerald
  gold: '#f59e0b', // amber
  liquid: '#8b5cf6', // purple
}

// Custom Tooltip for Pie Chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 p-2.5 shadow-xl backdrop-blur-xl animate-pop-in">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
          <p className="text-xs font-bold text-slate-100">{data.name}: {data.value}%</p>
        </div>
      </div>
    )
  }
  return null
}

export default function PortfolioAllocation() {
  const [data, setData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

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
      <div className="card card-pad animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-slate-800 rounded-xl"></div>
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 icon-morph-container">
            <PieIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-50">Portfolio Allocation</h2>
            <p className="text-xs text-slate-400">Asset class distribution</p>
          </div>
        </div>

        {data?.riskLevel && (
          <span className="px-2.5 py-1 rounded-xl text-xs font-semibold text-primary-300 bg-primary-500/10 ring-1 ring-primary-500/30">
            {data.riskLevel} Strategy
          </span>
        )}
      </div>

      {chartData.length > 0 && data && data.totalValue > 0 ? (
        <div className="space-y-4">
          {/* Donut Chart with Center Summary */}
          <div className="relative h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={86}
                  paddingAngle={4}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#020617"
                      strokeWidth={2}
                      className="transition-all duration-300 cursor-pointer"
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
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Value</span>
              <span className="text-sm font-extrabold text-slate-100">
                ₹{animatedTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Asset Pills Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {chartData.map((item, index) => (
              <div
                key={index}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5 transition-all duration-200 cursor-pointer ${
                  activeIndex === index ? 'border-primary-500/50 bg-slate-900/90 scale-[1.02]' : 'hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-300">{item.value}%</span>
              </div>
            ))}
          </div>

          {/* AI Recommendation Alert */}
          {data?.recommendation && (
            <div className="mt-3 rounded-xl border border-primary-500/20 bg-primary-500/5 p-3 flex items-start gap-2.5">
              <Shield className="h-4 w-4 text-primary-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-primary-300">Rebalancing Intelligence</p>
                <p className="mt-0.5 text-[11px] text-slate-400 leading-relaxed">
                  {data.recommendation}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/50 mb-2">
            <PieIcon className="h-5 w-5 text-slate-500" />
          </div>
          <p className="text-xs">Add assets and savings to generate portfolio distribution</p>
        </div>
      )}
    </div>
  )
}
