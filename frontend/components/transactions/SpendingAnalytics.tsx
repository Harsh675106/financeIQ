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

interface SpendingAnalyticsProps {
  refreshKey?: number
}

const CATEGORY_COLORS = [
  '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6', '#f43f5e', '#14b8a6'
]

export default function SpendingAnalytics({ refreshKey = 0 }: SpendingAnalyticsProps) {
  const [breakdown, setBreakdown] = useState<any[]>([])
  const [trend, setTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeChart, setActiveChart] = useState<'both' | 'category' | 'trend'>('both')

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Category Breakdown Bar Chart */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950/95 p-6 md:p-7 shadow-2xl backdrop-blur-xl stage-card-lift">
          <div className="flex items-center justify-between mb-5 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-md">
                <BarChart3 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  Category Outflow Velocity
                </h3>
                <p className="text-xs text-slate-400">Total expense distribution by domain</p>
              </div>
            </div>

            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
              {breakdown.length} Categories
            </span>
          </div>

          {loading ? (
            <div className="h-60 bg-slate-800/40 rounded-2xl animate-pulse border border-slate-800" />
          ) : breakdown.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center text-slate-400">
              <BarChart3 className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-xs">No category breakdown data available yet.</p>
            </div>
          ) : (
            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis
                    dataKey="category"
                    stroke="#64748b"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) =>
                      val >= 100000 ? `₹${(val / 100000).toFixed(0)}L` : val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`
                    }
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md">
                            <p className="font-semibold text-slate-200 text-xs mb-1 capitalize">{label}</p>
                            <p className="font-mono text-sm font-bold text-emerald-400">
                              ₹{Number(payload[0]?.value || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Monthly Inflow vs Outflow Waveform Area Chart */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950/95 p-6 md:p-7 shadow-2xl backdrop-blur-xl stage-card-lift">
          <div className="flex items-center justify-between mb-5 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-md">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  Inflow vs Outflow Rhythm
                </h3>
                <p className="text-xs text-slate-400">Monthly cash delta timeline</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> Expense
              </span>
            </div>
          </div>

          {loading ? (
            <div className="h-60 bg-slate-800/40 rounded-2xl animate-pulse border border-slate-800" />
          ) : trend.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center text-slate-400">
              <TrendingUp className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-xs">No monthly trend data recorded yet.</p>
            </div>
          ) : (
            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) =>
                      val >= 100000 ? `₹${(val / 100000).toFixed(0)}L` : val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`
                    }
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md space-y-1">
                            <p className="font-semibold text-slate-200 text-xs mb-1">{label}</p>
                            <div className="flex items-center justify-between gap-4 text-xs">
                              <span className="text-emerald-400">Income:</span>
                              <span className="font-mono font-bold text-slate-100">
                                ₹{Number(payload[0]?.value || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-xs">
                              <span className="text-rose-400">Expense:</span>
                              <span className="font-mono font-bold text-slate-100">
                                ₹{Number(payload[1]?.value || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#incomeWave)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#expenseWave)"
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
