import React, { useEffect, useState } from 'react'

interface AnimatedStatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  trend?: number
  delay?: number
  badge?: string
  format?: 'currency' | 'percent' | 'number'
}

export default function AnimatedStatCard({
  title,
  value,
  icon,
  trend,
  delay = 0,
  badge,
  format = 'currency',
}: AnimatedStatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (typeof value !== 'number') return

    let current = 0
    const target = value
    const increment = target / 30

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setDisplayValue(target)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, 30)

    return () => clearInterval(timer)
  }, [value])

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(val)
      case 'percent':
        return `${val.toFixed(1)}%`
      default:
        return val.toLocaleString()
    }
  }

  const trendColor = trend && trend > 0 ? 'text-success-400' : trend && trend < 0 ? 'text-danger-400' : 'text-slate-400'
  const trendIcon = trend && trend > 0 ? '↑' : trend && trend < 0 ? '↓' : '→'

  return (
    <div
      className="card card-interactive animate-fade-up space-y-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-slate-50 mt-2 counter-pulse">
            {typeof value === 'number' ? formatValue(displayValue) : value}
          </h3>
          {trend !== undefined && (
            <p className={`text-xs mt-2 font-semibold ${trendColor} flex items-center gap-1`}>
              <span>{trendIcon}</span>
              <span>{Math.abs(trend)}% from last month</span>
            </p>
          )}
        </div>
        <div className="p-3 bg-primary-500/10 rounded-lg text-primary-400 animate-glow-pulse">
          {icon}
        </div>
      </div>
      {badge && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <span className="badge-bounce inline-flex px-2 py-1 text-xs font-semibold rounded-lg bg-primary-500/20 text-primary-300">
            {badge}
          </span>
        </div>
      )}
    </div>
  )
}
