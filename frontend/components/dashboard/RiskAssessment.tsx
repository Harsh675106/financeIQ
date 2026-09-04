'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Shield, AlertCircle, Sparkles, Activity, Compass } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'

interface RiskData {
  hasData?: boolean
  riskScore: number | null
  riskLevel: 'Conservative' | 'Balanced' | 'Aggressive' | null
  stressProbability: number | null
}

export default function RiskAssessment() {
  const [data, setData] = useState<RiskData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchRiskData = async () => {
    try {
      const response = await api.get('/finance/risk-assessment')
      setData(response.data)
    } catch (error: any) {
      console.error('Failed to fetch risk data:', error)
      setData({
        riskScore: 50,
        riskLevel: 'Balanced',
        stressProbability: 8.5,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRiskData()
    const interval = setInterval(fetchRiskData, 30000)
    return () => clearInterval(interval)
  }, [])

  const scoreVal = data?.riskScore || 50
  const animatedScore = useCountUp(scoreVal, { duration: 1000 })
  const animatedStress = useCountUp(Math.round((data?.stressProbability || 0) * 10), { duration: 1000 }) / 10

  if (loading) {
    return (
      <div className="card card-pad animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-slate-800 rounded-xl"></div>
      </div>
    )
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Conservative':
        return 'text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-500/30'
      case 'Balanced':
        return 'text-primary-300 bg-primary-500/10 ring-1 ring-primary-500/30'
      case 'Aggressive':
        return 'text-rose-300 bg-rose-500/10 ring-1 ring-rose-500/30'
      default:
        return 'text-slate-300 bg-slate-800/60 ring-1 ring-slate-700'
    }
  }

  // Dial needle angle calculation (-90deg to +90deg)
  const needleAngle = -90 + (scoreVal / 100) * 180

  return (
    <div className="card card-pad card-spotlight group animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 icon-morph-container">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-50">Risk Assessment</h2>
            <p className="text-xs text-slate-400">Stress exposure & risk appetite</p>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${getRiskColor(
            data?.riskLevel || 'Balanced'
          )}`}
        >
          {data?.riskLevel || 'Balanced'}
        </span>
      </div>

      <div className="space-y-4">
        {/* Semi-Circle SVG Dial & Score */}
        <div className="relative flex flex-col items-center justify-center pt-2 pb-1">
          <div className="relative w-48 h-24 overflow-hidden flex items-end justify-center">
            <svg className="w-48 h-48 -rotate-180 transform" viewBox="0 0 100 100">
              {/* Background Arch Segments */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
                strokeDasharray="125.6 125.6"
              />
              {/* Conservative zone (Green) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#10b981"
                strokeWidth="10"
                strokeDasharray="41.8 125.6"
                strokeDashoffset="0"
                opacity="0.75"
              />
              {/* Balanced zone (Teal/Cyan) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="10"
                strokeDasharray="41.8 125.6"
                strokeDashoffset="-41.8"
                opacity="0.75"
              />
              {/* Aggressive zone (Red/Rose) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="10"
                strokeDasharray="41.8 125.6"
                strokeDashoffset="-83.6"
                opacity="0.75"
              />
            </svg>

            {/* Dial Needle */}
            <div
              className="absolute bottom-0 left-1/2 w-1 h-20 origin-bottom bg-slate-100 rounded-full shadow-[0_0_10px_#ffffff] transition-transform duration-1000 ease-out"
              style={{ transform: `translateX(-50%) rotate(${needleAngle}deg)` }}
            />
            {/* Center Pivot Point */}
            <div className="absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full bg-slate-900 border-2 border-primary-400 shadow-md z-10" />
          </div>

          {/* Value Display */}
          <div className="text-center mt-2">
            <span className="text-2xl font-black text-slate-50">{animatedScore}</span>
            <span className="text-xs text-slate-400"> / 100 Risk Score</span>
          </div>
        </div>

        {/* Stress Probability Pill */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
              12-Month Financial Stress Probability
            </span>
            <span className="text-xs font-bold text-rose-400">
              {animatedStress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(5, animatedStress * 2.5))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
