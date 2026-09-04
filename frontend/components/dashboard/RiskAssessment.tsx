'use client'

import { useEffect, useState, useRef } from 'react'
import { api } from '@/lib/api'
import { Shield, Activity, Sparkles, RotateCcw } from 'lucide-react'
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
  const [hoverScore, setHoverScore] = useState<number | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const dialRef = useRef<HTMLDivElement>(null)

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

  const actualScore = data?.riskScore ?? 50
  const activeScore = hoverScore !== null ? hoverScore : actualScore
  const animatedScore = useCountUp(actualScore, { duration: 1000 })

  const getDynamicRiskLevel = (score: number): 'Conservative' | 'Balanced' | 'Aggressive' => {
    if (score <= 35) return 'Conservative'
    if (score <= 70) return 'Balanced'
    return 'Aggressive'
  }

  const currentLevel = hoverScore !== null ? getDynamicRiskLevel(hoverScore) : (data?.riskLevel || getDynamicRiskLevel(actualScore))

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Conservative':
        return 'text-emerald-300 bg-emerald-500/15 ring-1 ring-emerald-500/30'
      case 'Balanced':
        return 'text-primary-300 bg-primary-500/15 ring-1 ring-primary-500/30'
      case 'Aggressive':
        return 'text-rose-300 bg-rose-500/15 ring-1 ring-rose-500/30'
      default:
        return 'text-slate-300 bg-slate-800/60 ring-1 ring-slate-700'
    }
  }

  // Handle interactive mouse move across the arch to calculate interactive needle angle
  const handleDialMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dialRef.current) return
    const rect = dialRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left // 0 to width
    const y = e.clientY - rect.top // 0 to height

    // Calculate angle from center bottom of the dial
    const centerX = rect.width / 2
    const centerY = rect.height
    const deltaX = x - centerX
    const deltaY = centerY - y

    // Angle in degrees from left (-90) to right (+90)
    let rad = Math.atan2(deltaX, deltaY)
    let deg = (rad * 180) / Math.PI

    // Clamp between -90 and 90
    deg = Math.max(-90, Math.min(90, deg))

    // Map -90..90 to 0..100 score
    const calculatedScore = Math.round(((deg + 90) / 180) * 100)
    setHoverScore(calculatedScore)
    setIsHovered(true)
  }

  const handleDialMouseLeave = () => {
    setHoverScore(null)
    setIsHovered(false)
  }

  const needleAngle = -90 + (activeScore / 100) * 180
  const displayedStress = (activeScore * 0.18).toFixed(1)

  if (loading) {
    return (
      <div className="card card-pad animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-slate-800 rounded-xl"></div>
      </div>
    )
  }

  return (
    <div className="card card-pad card-spotlight group animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 icon-morph-container">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-50">Risk Assessment</h2>
              {isHovered && (
                <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300 animate-fade-in">
                  <Sparkles className="h-2.5 w-2.5" />
                  Interactive Simulator
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Stress exposure & risk appetite</p>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-300 ${getRiskColor(
            currentLevel
          )}`}
        >
          {currentLevel}
        </span>
      </div>

      <div className="space-y-4">
        {/* Interactive Semi-Circle SVG Dial */}
        <div
          ref={dialRef}
          onMouseMove={handleDialMouseMove}
          onMouseLeave={handleDialMouseLeave}
          className="relative flex flex-col items-center justify-center pt-2 pb-1 cursor-ew-resize select-none"
          title="Move cursor over dial to simulate risk scenarios"
        >
          <div className="relative w-52 h-28 overflow-hidden flex items-end justify-center">
            <svg className="w-52 h-52 -rotate-180 transform" viewBox="0 0 100 100">
              {/* Background Arch */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#1e293b"
                strokeWidth="11"
                strokeDasharray="125.6 125.6"
              />
              {/* Conservative zone (Green) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#10b981"
                strokeWidth="11"
                strokeDasharray="41.8 125.6"
                strokeDashoffset="0"
                className={`transition-opacity duration-200 ${
                  activeScore <= 35 ? 'opacity-100 filter drop-shadow(0 0 6px rgba(16,185,129,0.7))' : 'opacity-60'
                }`}
              />
              {/* Balanced zone (Teal/Cyan) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="11"
                strokeDasharray="41.8 125.6"
                strokeDashoffset="-41.8"
                className={`transition-opacity duration-200 ${
                  activeScore > 35 && activeScore <= 70
                    ? 'opacity-100 filter drop-shadow(0 0 6px rgba(6,182,212,0.7))'
                    : 'opacity-60'
                }`}
              />
              {/* Aggressive zone (Rose/Red) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="11"
                strokeDasharray="41.8 125.6"
                strokeDashoffset="-83.6"
                className={`transition-opacity duration-200 ${
                  activeScore > 70 ? 'opacity-100 filter drop-shadow(0 0 6px rgba(244,63,94,0.7))' : 'opacity-60'
                }`}
              />
            </svg>

            {/* Dynamic Needle Pin */}
            <div
              className="absolute bottom-0 left-1/2 w-1.5 h-24 origin-bottom rounded-full shadow-2xl transition-transform ease-out pointer-events-none"
              style={{
                transform: `translateX(-50%) rotate(${needleAngle}deg)`,
                transitionDuration: isHovered ? '75ms' : '650ms',
                background: 'linear-gradient(to top, #64748b, #f8fafc)',
              }}
            >
              {/* Needle Glowing Tip */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 h-3 w-3 rounded-full shadow-[0_0_12px_#34d399]"
                style={{
                  backgroundColor:
                    activeScore <= 35 ? '#10b981' : activeScore <= 70 ? '#06b6d4' : '#f43f5e',
                }}
              />
            </div>

            {/* Center Pivot Hub */}
            <div className="absolute bottom-0 left-1/2 h-5 w-5 -translate-x-1/2 translate-y-1/2 rounded-full bg-slate-950 border-2 border-primary-400 shadow-xl z-10 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-ping" />
            </div>
          </div>

          {/* Interactive Score Counter */}
          <div className="text-center mt-2.5">
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-3xl font-extrabold text-slate-50 tracking-tight transition-all">
                {isHovered ? hoverScore : animatedScore}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ 100</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isHovered ? (
                <span className="text-primary-300 font-medium">Hovering Simulator • Release to reset</span>
              ) : (
                'Assessed Risk Tolerance Score'
              )}
            </p>
          </div>
        </div>

        {/* Quick Zone Jump Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { label: 'Conservative', score: 25, color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10' },
            { label: 'Balanced', score: 55, color: 'hover:border-cyan-500/50 hover:bg-cyan-500/10' },
            { label: 'Aggressive', score: 85, color: 'hover:border-rose-500/50 hover:bg-rose-500/10' },
          ].map((zone, idx) => (
            <button
              key={idx}
              onMouseEnter={() => {
                setHoverScore(zone.score)
                setIsHovered(true)
              }}
              onMouseLeave={handleDialMouseLeave}
              className={`rounded-lg border border-slate-800 bg-slate-950/60 py-1.5 text-[11px] font-medium text-slate-300 transition-all ${zone.color}`}
            >
              {zone.label}
            </button>
          ))}
        </div>

        {/* Stress Probability Dynamic Wave Bar */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
              12-Month Stress Exposure
            </span>
            <span className="text-xs font-bold text-rose-400">
              {isHovered ? displayedStress : (data?.stressProbability || 0).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(5, (isHovered ? parseFloat(displayedStress) : data?.stressProbability || 8.5) * 2.5)
                )}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
