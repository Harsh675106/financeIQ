'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { TrendingUp, Shield } from 'lucide-react'

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
  equity: '#0ea5e9',
  debt: '#22c55e',
  gold: '#f59e0b',
  liquid: '#8b5cf6',
}

interface AllocationLabelProps {
  name?: string | number
  percent?: number
  value?: number | string
}

const renderAllocationLabel = ({ name, percent = 0, value = 0 }: AllocationLabelProps) => {
  if (Number(value) <= 0 || percent <= 0) {
    return null
  }

  return `${name}: ${(percent * 100).toFixed(0)}%`
}

export default function PortfolioAllocation() {
  const [data, setData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPortfolioData()
  }, [])

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

  if (loading) {
    return (
      <div className="card card-pad animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-slate-800 rounded-xl"></div>
      </div>
    )
  }

  const chartData = data?.currentAllocation ? [
    { name: 'Equity', value: data.currentAllocation.equity, color: COLORS.equity },
    { name: 'Debt', value: data.currentAllocation.debt, color: COLORS.debt },
    { name: 'Gold', value: data.currentAllocation.gold, color: COLORS.gold },
    { name: 'Liquid', value: data.currentAllocation.liquid, color: COLORS.liquid },
  ] : []

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Conservative':
        return 'text-success-200 bg-success-500/10 ring-1 ring-success-500/20'
      case 'Balanced':
        return 'text-primary-200 bg-primary-500/10 ring-1 ring-primary-500/20'
      case 'Aggressive':
        return 'text-danger-200 bg-danger-500/10 ring-1 ring-danger-500/20'
      default:
        return 'text-slate-200 bg-slate-800/60 ring-1 ring-slate-700'
    }
  }

  return (
    <div className="card card-pad card-hover">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-primary-300" />
          <h2 className="text-lg font-semibold text-slate-50">Portfolio Allocation</h2>
        </div>
        {data?.riskLevel && (
          <span className={`px-3 py-1 rounded-xl text-sm font-semibold ${getRiskColor(data.riskLevel)}`}>
            {data.riskLevel}
          </span>
        )}
      </div>

      {chartData.length > 0 && data && data.totalValue > 0 ? (
        <div className="space-y-6">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderAllocationLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-4">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-100">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.value}%</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800/70 text-sm text-slate-300">
            <span className="font-medium">Total Value:</span> ₹{data.totalValue?.toLocaleString('en-IN')}
          </div>

          {data?.recommendation && (
            <div className="pt-4 border-t border-slate-800/70">
              <div className="flex items-start space-x-2">
                <Shield className="h-5 w-5 text-primary-300 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-100 mb-1">Recommendation</p>
                  <p className="text-sm text-slate-400">{data.recommendation}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400">
          <p>Add assets and savings to see portfolio allocation</p>
        </div>
      )}
    </div>
  )
}
