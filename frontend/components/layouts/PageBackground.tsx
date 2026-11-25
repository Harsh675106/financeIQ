'use client'

import type { CSSProperties } from 'react'

type Variant =
  | 'aurora'
  | 'particles'
  | 'upward'
  | 'grid'
  | 'trend'
  | 'radial'
  | 'sparkles'
  | 'warning'
  | 'orbit'
  | 'flow'

interface PageBackgroundProps {
  variant?: Variant
}

/** Orb colours per page so each section has its own subtle identity. */
const ORB_TONES: Record<Variant, [string, string, string]> = {
  aurora: ['rgba(112, 104, 244, 0.30)', 'rgba(139, 92, 246, 0.22)', 'rgba(34, 211, 238, 0.16)'],
  particles: ['rgba(112, 104, 244, 0.26)', 'rgba(34, 211, 238, 0.18)', 'rgba(167, 139, 250, 0.16)'],
  upward: ['rgba(52, 211, 153, 0.18)', 'rgba(112, 104, 244, 0.24)', 'rgba(34, 211, 238, 0.14)'],
  grid: ['rgba(112, 104, 244, 0.26)', 'rgba(34, 211, 238, 0.18)', 'rgba(139, 92, 246, 0.16)'],
  trend: ['rgba(34, 211, 238, 0.2)', 'rgba(112, 104, 244, 0.26)', 'rgba(52, 211, 153, 0.12)'],
  radial: ['rgba(139, 92, 246, 0.26)', 'rgba(112, 104, 244, 0.22)', 'rgba(34, 211, 238, 0.14)'],
  sparkles: ['rgba(139, 92, 246, 0.26)', 'rgba(112, 104, 244, 0.24)', 'rgba(34, 211, 238, 0.14)'],
  warning: ['rgba(245, 158, 11, 0.16)', 'rgba(244, 63, 94, 0.16)', 'rgba(112, 104, 244, 0.18)'],
  orbit: ['rgba(112, 104, 244, 0.24)', 'rgba(34, 211, 238, 0.14)', 'rgba(139, 92, 246, 0.16)'],
  flow: ['rgba(112, 104, 244, 0.24)', 'rgba(52, 211, 153, 0.12)', 'rgba(34, 211, 238, 0.16)'],
}

const STARS = Array.from({ length: 14 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  top: `${8 + ((index * 53) % 70)}%`,
  delay: `${(index % 7) * 0.6}s`,
}))

const orbStyle = (color: string): CSSProperties => ({
  background: `radial-gradient(circle, ${color}, transparent 70%)`,
})

export default function PageBackground({ variant = 'aurora' }: PageBackgroundProps) {
  const [a, b, c] = ORB_TONES[variant] ?? ORB_TONES.aurora
  const showStars = variant === 'sparkles' || variant === 'particles'
  const showRings = variant === 'radial' || variant === 'orbit'
  const showLines = variant === 'trend' || variant === 'upward'

  return (
    <div className={`page-background page-background-${variant}`} aria-hidden="true">
      <div className="page-bg-orb page-bg-orb-a" style={orbStyle(a)} />
      <div className="page-bg-orb page-bg-orb-b" style={orbStyle(b)} />
      <div className="page-bg-orb page-bg-orb-c" style={orbStyle(c)} />

      {variant === 'grid' && <div className="page-bg-grid" />}

      {showLines && (
        <>
          <div className="page-bg-line page-bg-line-1" />
          <div className="page-bg-line page-bg-line-2" />
        </>
      )}

      {showRings && (
        <>
          <div className="page-bg-ring page-bg-ring-1" />
          <div className="page-bg-ring page-bg-ring-2" />
        </>
      )}

      {showStars &&
        STARS.map((star, index) => (
          <span
            key={index}
            className="page-bg-star"
            style={{ left: star.left, top: star.top, animationDelay: star.delay }}
          />
        ))}

      {variant === 'flow' && <div className="page-bg-wave" />}
    </div>
  )
}
