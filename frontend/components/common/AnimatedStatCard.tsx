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

  const trendColor = trend && trend > 0 ? 'badge-success' : trend && trend < 0 ? 'badge-danger' : 'badge-neutral'
  const trendIcon = trend && trend > 0 ? '↑' : trend && trend < 0 ? '↓' : '→'

  return (
    <div
      className="card card-pad card-interactive hover-lift animate-fade-up space-y-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{title}</p>
          <h3 className="kpi-value mt-2 text-2xl [overflow-wrap:anywhere] sm:text-3xl">
            {typeof value === 'number' ? formatValue(displayValue) : value}
          </h3>
          {trend !== undefined && (
            <p className={`badge ${trendColor} mt-2.5`}>
              <span aria-hidden="true">{trendIcon}</span>
              <span>{Math.abs(trend)}% from last month</span>
            </p>
          )}
        </div>
        <div className="icon-tile">{icon}</div>
      </div>
      {badge && (
        <div className="flex items-center gap-2 border-t border-line pt-3">
          <span className="badge badge-brand">{badge}</span>
        </div>
      )}
    </div>
  )
}
