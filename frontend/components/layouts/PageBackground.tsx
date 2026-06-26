'use client'

interface PageBackgroundProps {
  variant?:
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
}

const particleItems = Array.from({ length: 12 }, (_, index) => ({
  left: `${6 + (index % 6) * 15}%`,
  top: `${10 + Math.floor(index / 6) * 32}%`,
  size: `${4 + (index % 3) * 3}px`,
  delay: `${index * 0.8}s`,
}))

export default function PageBackground({ variant = 'aurora' }: PageBackgroundProps) {
  return (
    <div className={`page-background page-background-${variant}`} aria-hidden="true">
      {variant === 'aurora' ? (
        <>
          <div className="page-bg-aurora-orb page-bg-aurora-orb-1" />
          <div className="page-bg-aurora-orb page-bg-aurora-orb-2" />
          <div className="page-bg-aurora-orb page-bg-aurora-orb-3" />
        </>
      ) : null}

      {variant === 'particles' ? (
        particleItems.map((particle, index) => (
          <span
            key={`${particle.left}-${index}`}
            className="page-bg-particle"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              animationDelay: particle.delay,
            }}
          />
        ))
      ) : null}

      {variant === 'upward' ? (
        <>
          <div className="page-bg-rise-ring page-bg-rise-ring-1" />
          <div className="page-bg-rise-ring page-bg-rise-ring-2" />
          <div className="page-bg-rise-ring page-bg-rise-ring-3" />
          <div className="page-bg-rise-ring page-bg-rise-ring-4" />
        </>
      ) : null}

      {variant === 'grid' ? <div className="page-bg-grid" /> : null}

      {variant === 'trend' ? (
        <>
          <div className="page-bg-trend-line page-bg-trend-line-1" />
          <div className="page-bg-trend-line page-bg-trend-line-2" />
        </>
      ) : null}

      {variant === 'radial' ? (
        <>
          <div className="page-bg-radial-ring page-bg-radial-ring-1" />
          <div className="page-bg-radial-ring page-bg-radial-ring-2" />
          <div className="page-bg-radial-ring page-bg-radial-ring-3" />
        </>
      ) : null}

      {variant === 'sparkles' ? (
        <>
          <div className="page-bg-sparkle page-bg-sparkle-1" />
          <div className="page-bg-sparkle page-bg-sparkle-2" />
          <div className="page-bg-sparkle page-bg-sparkle-3" />
          <div className="page-bg-sparkle page-bg-sparkle-4" />
        </>
      ) : null}

      {variant === 'warning' ? (
        <>
          <div className="page-bg-warning-blob page-bg-warning-blob-1" />
          <div className="page-bg-warning-blob page-bg-warning-blob-2" />
          <div className="page-bg-warning-blob page-bg-warning-blob-3" />
        </>
      ) : null}

      {variant === 'orbit' ? (
        <>
          <div className="page-bg-orbit-ring page-bg-orbit-ring-1" />
          <div className="page-bg-orbit-ring page-bg-orbit-ring-2" />
          <div className="page-bg-orbit-core" />
        </>
      ) : null}

      {variant === 'flow' ? (
        <>
          <div className="page-bg-flow-wave page-bg-flow-wave-1" />
          <div className="page-bg-flow-wave page-bg-flow-wave-2" />
        </>
      ) : null}
    </div>
  )
}
