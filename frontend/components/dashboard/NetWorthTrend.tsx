'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface TrendPoint { month: string; netWorth: number }
interface NetWorth { assetsTotal: number; liabilitiesTotal: number; current: number; trend: TrendPoint[] }
interface DashboardResponse { netWorth: NetWorth }

function formatCompactRupees(value: number) {
  const absoluteValue = Math.abs(Number(value) || 0)
  const sign = value < 0 ? '-' : ''

  if (absoluteValue >= 10000000) {
    return `${sign}Rs ${(absoluteValue / 10000000).toFixed(1)}Cr`
  }

  if (absoluteValue >= 100000) {
    return `${sign}Rs ${(absoluteValue / 100000).toFixed(1)}L`
  }

  if (absoluteValue >= 1000) {
    return `${sign}Rs ${(absoluteValue / 1000).toFixed(1)}K`
  }

  return `${sign}Rs ${absoluteValue.toLocaleString('en-IN')}`
}

function formatFullRupees(value: number) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`
}

export default function NetWorthTrend() {
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res = await api.get<DashboardResponse>('/analytics/dashboard')
      setTrend(res.data.netWorth?.trend || [])
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

  return (
    <div className="card card-pad card-hover">
      <div className="mb-4 flex items-center space-x-2">
        <TrendingUp className="h-6 w-6 text-primary-300" />
        <h2 className="text-lg font-semibold text-slate-50">Net Worth Trend</h2>
      </div>

      {loading ? (
        <div className="h-64 rounded-xl bg-slate-800/60 animate-pulse"></div>
      ) : trend.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <p className="text-sm">Add transactions and track your net worth over time</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 8, right: 12, left: 20, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                width={84}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCompactRupees(Number(value))}
              />
              <Tooltip formatter={(value: number) => formatFullRupees(value)} />
              <Line type="monotone" dataKey="netWorth" stroke="#34d399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
