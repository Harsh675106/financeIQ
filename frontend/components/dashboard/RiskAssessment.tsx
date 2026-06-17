'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Shield, AlertCircle } from 'lucide-react'

interface RiskData {
  hasData?: boolean
  riskScore: number | null
  riskLevel: 'Conservative' | 'Balanced' | 'Aggressive' | null
  stressProbability: number | null
}

export default function RiskAssessment() {
  const [data, setData] = useState<RiskData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRiskData()
    const interval = setInterval(fetchRiskData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchRiskData = async () => {
    try {
      const response = await api.get('/finance/risk-assessment')
      setData(response.data)
    } catch (error: any) {
      console.error('Failed to fetch risk data:', error)
      // Set default values on error
      setData({
        riskScore: 50,
        riskLevel: 'Balanced',
        stressProbability: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card card-pad animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-slate-800 rounded-xl"></div>
      </div>
    )
  }

  if (!data?.hasData || data?.riskScore === null) {
    return (
      <div className="card card-pad card-hover animate-fade-up">
        <div className="flex items-center space-x-2 mb-6">
          <div className="p-2 bg-primary-500/10 rounded-lg animate-glow-pulse">
            <Shield className="h-6 w-6 text-primary-300" />
          </div>
          <h2 className="text-lg font-semibold text-slate-50">Risk Assessment</h2>
        </div>
        <p className="text-slate-400 text-center py-8">
          Add financial data to see risk assessment
        </p>
      </div>
    )
  }

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
    <div className="card card-pad card-hover animate-fade-up">
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 bg-primary-500/10 rounded-lg animate-glow-pulse">
          <Shield className="h-6 w-6 text-primary-300" />
        </div>
        <h2 className="text-lg font-semibold text-slate-50">Risk Assessment</h2>
      </div>

      <div className="space-y-6">
        <div className="animate-fade-up stagger-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-400">Risk Tolerance Score</span>
            <span className="text-2xl font-bold text-slate-50 counter-pulse">{data?.riskScore || 0}/100</span>
          </div>
          <div className="w-full bg-slate-800/70 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-400 to-primary-600 h-3 rounded-full transition-all duration-500 animate-slide-in-left"
              style={{ width: `${data?.riskScore || 0}%` }}
            ></div>
          </div>
        </div>

        <div className="animate-fade-up stagger-2">
          <span className="text-sm font-medium text-slate-400 block mb-2">Risk Level</span>
          <span className={`inline-block px-4 py-2 rounded-xl font-semibold animate-scale-in ${getRiskColor(data?.riskLevel || '')}`}>
            {data?.riskLevel || 'Not Assessed'}
          </span>
        </div>

        <div className="pt-4 border-t border-slate-800/70 animate-fade-up stagger-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-400 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 animate-pulse-ring" />
              <span>Financial Stress Probability</span>
            </span>
            <span className="text-lg font-bold text-danger-300 counter-pulse">
              {(data?.stressProbability || 0).toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Probability of financial stress in the next 12 months
          </p>
        </div>
      </div>
    </div>
  )
}
