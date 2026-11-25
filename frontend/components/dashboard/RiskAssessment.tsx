'use client'

import { useEffect, useState, useRef } from 'react'
import { api } from '@/lib/api'
import { Shield, Activity, Sparkles, RotateCcw } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { chartColors } from '@/lib/chartTheme'

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
        return 'badge-success'
      case 'Balanced':
        return 'badge-info'
      case 'Aggressive':
        return 'badge-danger'
      default:
        return 'badge-neutral'
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
  const needleTipColor =
    activeScore <= 35 ? chartColors.positiveStrong : activeScore <= 70 ? chartColors.cyan : chartColors.negativeStrong

  if (loading) {
    return (
      <div className="card card-pad" aria-busy="true">
        <div className="mb-5 flex items-center gap-3">
          <div className="skeleton h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        </div>
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="card card-pad card-spotlight group animate-fade-up">
      {/* Header */}
      <div className="relative mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile icon-tile-brand icon-morph-container">
            <Shield className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="card-title">Risk Assessment</h2>
              {isHovered && (
                <span className="badge badge-info animate-fade-in px-2 text-[10px] leading-4">
                  <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                  Interactive Simulator
                </span>
              )}
            </div>
            <p className="card-subtitle">Stress exposure & risk appetite</p>
          </div>
        </div>

        <span className={`badge shrink-0 px-3 py-1 text-xs transition-colors duration-300 ${getRiskColor(currentLevel)}`}>
          {currentLevel}
        </span>
      </div>

      <div className="relative space-y-4">
        {/* Interactive Semi-Circle SVG Dial */}
        <div
          ref={dialRef}
          onMouseMove={handleDialMouseMove}
          onMouseLeave={handleDialMouseLeave}
          className="relative flex cursor-ew-resize select-none flex-col items-center justify-center pb-1 pt-2"
          title="Move cursor over dial to simulate risk scenarios"
        >
          {/* Soft glow behind the dial */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-4 h-28 w-48 -translate-x-1/2 rounded-full bg-primary-500/15 blur-3xl"
          />

          <div className="relative flex h-28 w-52 items-end justify-center overflow-hidden">
            <svg className="h-52 w-52 -rotate-180 transform" viewBox="0 0 100 100" aria-hidden="true">
              {/* Background Arch */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="11"
                strokeDasharray="125.6 125.6"
              />
              {/* Conservative zone (Green) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={chartColors.positiveStrong}
                strokeWidth="11"
                strokeDasharray="41.8 125.6"
                strokeDashoffset="0"
                className={`transition-opacity duration-200 ${
                  activeScore <= 35 ? 'opacity-100 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]' : 'opacity-40'
                }`}
              />
              {/* Balanced zone (Teal/Cyan) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={chartColors.cyan}
                strokeWidth="11"
                strokeDasharray="41.8 125.6"
                strokeDashoffset="-41.8"
                className={`transition-opacity duration-200 ${
                  activeScore > 35 && activeScore <= 70
                    ? 'opacity-100 drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]'
                    : 'opacity-40'
                }`}
              />
              {/* Aggressive zone (Rose/Red) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={chartColors.negativeStrong}
                strokeWidth="11"
                strokeDasharray="41.8 125.6"
                strokeDashoffset="-83.6"
                className={`transition-opacity duration-200 ${
                  activeScore > 70 ? 'opacity-100 drop-shadow-[0_0_6px_rgba(244,63,94,0.7)]' : 'opacity-40'
                }`}
              />
            </svg>

            {/* Dynamic Needle Pin */}
            <div
              className="pointer-events-none absolute bottom-0 left-1/2 h-24 w-1.5 origin-bottom rounded-full shadow-2xl transition-transform ease-out motion-reduce:transition-none"
              style={{
                transform: `translateX(-50%) rotate(${needleAngle}deg)`,
                transitionDuration: isHovered ? '75ms' : '650ms',
                background: 'linear-gradient(to top, #4a5170, #f7f8fc)',
              }}
            >
              {/* Needle Glowing Tip */}
              <div
                className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1 rounded-full ring-2 ring-[#090b17]"
                style={{
                  backgroundColor: needleTipColor,
                  boxShadow: `0 0 12px ${needleTipColor}`,
                }}
              />
            </div>

            {/* Center Pivot Hub */}
            <div className="absolute bottom-0 left-1/2 z-10 flex h-5 w-5 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border-2 border-primary-400 bg-[#090b17] shadow-[0_0_14px_rgba(138,136,251,0.6)]">
              <div className="h-1.5 w-1.5 animate-ping rounded-full bg-primary-300" />
            </div>
          </div>

          {/* Interactive Score Counter */}
          <div className="mt-3 text-center">
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="kpi-value text-3xl sm:text-4xl">
                {isHovered ? hoverScore : animatedScore}
              </span>
              <span className="text-xs font-semibold text-slate-500">/ 100</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {isHovered ? (
                <span className="font-medium text-primary-300">Hovering Simulator • Release to reset</span>
              ) : (
                'Assessed Risk Tolerance Score'
              )}
            </p>
          </div>
        </div>

        {/* Quick Zone Jump Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { label: 'Conservative', score: 25, color: 'hover:border-emerald-400/45 hover:bg-emerald-500/10 hover:text-emerald-200' },
            { label: 'Balanced', score: 55, color: 'hover:border-cyan-400/45 hover:bg-cyan-500/10 hover:text-cyan-200' },
            { label: 'Aggressive', score: 85, color: 'hover:border-rose-400/45 hover:bg-rose-500/10 hover:text-rose-200' },
          ].map((zone, idx) => (
            <button
              key={idx}
              onMouseEnter={() => {
                setHoverScore(zone.score)
                setIsHovered(true)
              }}
              onMouseLeave={handleDialMouseLeave}
              className={`min-h-[2.25rem] truncate rounded-xl border border-white/[0.07] bg-white/[0.025] px-1.5 py-2 text-[11px] font-medium text-slate-300 transition-colors ${zone.color}`}
            >
              {zone.label}
            </button>
          ))}
        </div>

        {/* Stress Probability Dynamic Wave Bar */}
        <div className="surface-inset p-3.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-300">
              <span className="icon-tile icon-tile-sm icon-tile-rose h-6 w-6 rounded-md">
                <Activity className="h-3.5 w-3.5" />
              </span>
              <span className="truncate">12-Month Stress Exposure</span>
            </span>
            <span className="num shrink-0 text-xs font-bold text-rose-300">
              {isHovered ? displayedStress : (data?.stressProbability || 0).toFixed(1)}%
            </span>
          </div>
          <div className="progress-track h-1.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-[width] duration-300"
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
