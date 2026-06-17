'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

interface FinancialData {
  hasData: boolean
  healthScore: number
  totalIncome: number
  totalExpenses: number
  savings: number
  debtRatio: number
  healthBreakdown?: {
    savingsScore: number
    emergencyScore: number
    debtScore: number
    goalScore: number
    diversificationScore: number
  }
}

export default function FinancialOverview() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFinancialData()
    const interval = setInterval(fetchFinancialData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchFinancialData = async () => {
    try {
      const response = await api.get('/analytics/dashboard')
      setData({
        hasData: response.data.hasData,
        healthScore: response.data.healthScore,
        totalIncome: response.data.totals.income,
        totalExpenses: response.data.totals.expenses,
        savings: response.data.totals.savings,
        debtRatio: response.data.metrics.debtRatio,
        healthBreakdown: response.data.healthBreakdown,
      })
    } catch (error: any) {
      console.error('Failed to fetch financial data:', error)
      // Set default values on error
      setData({
        hasData: false,
        healthScore: 0,
        totalIncome: 0,
        totalExpenses: 0,
        savings: 0,
        debtRatio: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card card-pad animate-pulse">
            <div className="h-4 bg-slate-800 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-slate-800 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!data?.hasData) {
    return (
      <div className="space-y-6">
        <div className="card card-pad text-center py-12">
          <DollarSign className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-50 mb-2">No Financial Data Yet</h3>
          <p className="text-slate-400 mb-6">
            Start by adding your income, expenses, debts, or savings to see your financial health score and insights.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard/transactions'}
            className="btn-primary inline-block"
          >
            Add Your First Transaction
          </button>
        </div>
      </div>
    )
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-400'
    if (score >= 60) return 'text-primary-300'
    if (score >= 40) return 'text-yellow-300'
    return 'text-danger-400'
  }

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Attention'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card card-pad card-hover animate-fade-up stagger-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-400">Health Score</span>
            <div className="p-2 bg-primary-500/10 rounded-lg animate-glow-pulse">
              <AlertTriangle className={`h-5 w-5 ${getHealthScoreColor(data?.healthScore || 0)}`} />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-bold ${getHealthScoreColor(data?.healthScore || 0)} counter-pulse`}>
              {data?.healthScore || 0}
            </span>
            <span className="text-sm text-slate-500">/100</span>
          </div>
          <p className={`text-sm mt-2 ${getHealthScoreColor(data?.healthScore || 0)}`}>
            {getHealthScoreLabel(data?.healthScore || 0)}
          </p>
        </div>

        <div className="card card-pad card-hover animate-fade-up stagger-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-400">Monthly Income</span>
            <div className="p-2 bg-success-500/10 rounded-lg animate-glow-pulse">
              <TrendingUp className="h-5 w-5 text-success-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-50 counter-pulse">
            ₹{data?.totalIncome?.toLocaleString('en-IN') || '0'}
          </p>
        </div>

        <div className="card card-pad card-hover animate-fade-up stagger-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-400">Monthly Expenses</span>
            <div className="p-2 bg-danger-500/10 rounded-lg animate-glow-pulse">
              <TrendingDown className="h-5 w-5 text-danger-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-50 counter-pulse">
            ₹{data?.totalExpenses?.toLocaleString('en-IN') || '0'}
          </p>
        </div>

        <div className="card card-pad card-hover animate-fade-up stagger-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-400">Savings</span>
            <div className="p-2 bg-primary-500/10 rounded-lg animate-glow-pulse">
              <DollarSign className="h-5 w-5 text-primary-300" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-50 counter-pulse">
            ₹{data?.savings?.toLocaleString('en-IN') || '0'}
          </p>
        </div>
      </div>

      {data?.healthBreakdown && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Savings', value: data.healthBreakdown.savingsScore, help: 'Savings rate contribution' },
            { label: 'Emergency', value: data.healthBreakdown.emergencyScore, help: 'Months of emergency fund' },
            { label: 'Debt', value: data.healthBreakdown.debtScore, help: 'Debt ratio impact' },
            { label: 'Goals', value: data.healthBreakdown.goalScore, help: 'Average goal progress' },
            { label: 'Diversification', value: data.healthBreakdown.diversificationScore, help: 'Portfolio diversification' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="card p-4 animate-fade-up card-hover"
              style={{ animationDelay: `${100 + idx * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">{item.label}</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-slate-50 counter-pulse">{Math.round(item.value)}</span>
                <span className="text-xs text-slate-500">/100</span>
              </div>
              <div className="mt-2 w-full bg-slate-800/70 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full animate-slide-in-left" 
                  style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }} 
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">{item.help}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
