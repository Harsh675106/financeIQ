'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts'

interface SpendingAnalyticsProps {
  refreshKey?: number
}

export default function SpendingAnalytics({ refreshKey = 0 }: SpendingAnalyticsProps) {
  const [breakdown, setBreakdown] = useState<any[]>([])
  const [trend, setTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card card-pad card-hover">
        <h3 className="text-lg font-semibold mb-4 text-slate-50">Category Breakdown</h3>
        {loading ? <div className="h-56 bg-slate-800/60 rounded-xl animate-pulse"/> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={breakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis/>
              <Tooltip formatter={(v:any)=>`₹${Number(v).toLocaleString('en-IN')}`}/>
              <Bar dataKey="total" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card card-pad card-hover">
        <h3 className="text-lg font-semibold mb-4 text-slate-50">Income vs Expense (Monthly)</h3>
        {loading ? <div className="h-56 bg-slate-800/60 rounded-xl animate-pulse"/> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v:any)=>`₹${Number(v).toLocaleString('en-IN')}`}/>
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#34d399" />
              <Line type="monotone" dataKey="expenses" stroke="#fb7185" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
