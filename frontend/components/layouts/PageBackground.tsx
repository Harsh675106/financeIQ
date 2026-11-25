'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import AmbientCanvas from '@/components/motion/AmbientCanvas'
import FloatingShapes, { type ShapeSpec } from '@/components/motion/FloatingShapes'

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
  aurora: ['rgba(52, 211, 153, 0.20)', 'rgba(56, 189, 248, 0.18)', 'rgba(167, 243, 208, 0.30)'],
  particles: ['rgba(52, 211, 153, 0.18)', 'rgba(56, 189, 248, 0.18)', 'rgba(186, 230, 253, 0.30)'],
  upward: ['rgba(52, 211, 153, 0.22)', 'rgba(125, 211, 252, 0.18)', 'rgba(167, 243, 208, 0.28)'],
  grid: ['rgba(45, 212, 191, 0.18)', 'rgba(56, 189, 248, 0.18)', 'rgba(167, 243, 208, 0.26)'],
  trend: ['rgba(56, 189, 248, 0.20)', 'rgba(52, 211, 153, 0.18)', 'rgba(186, 230, 253, 0.30)'],
  radial: ['rgba(99, 102, 241, 0.10)', 'rgba(56, 189, 248, 0.18)', 'rgba(167, 243, 208, 0.26)'],
  sparkles: ['rgba(52, 211, 153, 0.18)', 'rgba(99, 102, 241, 0.10)', 'rgba(186, 230, 253, 0.30)'],
  warning: ['rgba(251, 191, 36, 0.16)', 'rgba(251, 113, 133, 0.12)', 'rgba(167, 243, 208, 0.22)'],
  orbit: ['rgba(52, 211, 153, 0.18)', 'rgba(56, 189, 248, 0.16)', 'rgba(167, 243, 208, 0.24)'],
  flow: ['rgba(52, 211, 153, 0.20)', 'rgba(56, 189, 248, 0.18)', 'rgba(186, 230, 253, 0.28)'],
}

/**
 * A couple of soft 3D objects per page, kept to the edges and hidden on small
 * screens so they never compete with content.
 */
const SHAPES: Record<Variant, ShapeSpec[]> = {
  aurora: [
    { kind: 'cube', size: 58, style: { top: '14%', right: '4%' }, desktopOnly: true },
    { kind: 'orb', size: 70, style: { bottom: '12%', left: '3%' }, delay: 2, desktopOnly: true },
  ],
  particles: [{ kind: 'orb', size: 64, style: { top: '18%', right: '5%' }, desktopOnly: true }],
  upward: [{ kind: 'tile', size: 84, style: { top: '20%', right: '4%' }, desktopOnly: true }],
  grid: [
    { kind: 'ring', size: 120, style: { top: '10%', right: '3%' }, desktopOnly: true },
    { kind: 'cube', size: 46, style: { bottom: '16%', left: '4%' }, delay: 3, desktopOnly: true },
  ],
  trend: [{ kind: 'ring', size: 110, style: { bottom: '10%', right: '4%' }, desktopOnly: true }],
  radial: [
    { kind: 'orb', size: 62, style: { top: '16%', right: '5%' }, desktopOnly: true },
    { kind: 'ring', size: 96, style: { bottom: '12%', left: '3%' }, delay: 2.5, desktopOnly: true },
  ],
  sparkles: [{ kind: 'orb', size: 54, style: { bottom: '14%', right: '3%' }, desktopOnly: true }],
  warning: [{ kind: 'tile', size: 72, style: { top: '22%', right: '4%' }, desktopOnly: true }],
  orbit: [{ kind: 'ring', size: 118, style: { top: '16%', right: '5%' }, desktopOnly: true }],
  flow: [
    { kind: 'tile', size: 78, style: { top: '16%', right: '4%' }, desktopOnly: true },
    { kind: 'orb', size: 56, style: { bottom: '14%', left: '3%' }, delay: 2, desktopOnly: true },
  ],
}

const STARS = Array.from({ length: 14 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  top: `${8 + ((index * 53) % 70)}%`,
  delay: `${(index % 7) * 0.6}s`,
}))

const orbStyle = (color: string): CSSProperties => ({
  background: `radial-gradient(circle, ${color}, transparent 70%)`,
})

/**
 * Per-page ambient layer: gradient mesh, aurora ribbon, blurred orbs with
 * pointer/scroll parallax, light trails, particle network and a few 3D objects.
 * Fixed, inert (pointer-events: none) and motion-gated.
 */
export default function PageBackground({ variant = 'aurora' }: PageBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [a, b, c] = ORB_TONES[variant] ?? ORB_TONES.aurora
  const showStars = variant === 'sparkles' || variant === 'particles'
  const showRings = variant === 'radial' || variant === 'orbit'
  const showLines = variant === 'trend' || variant === 'upward'

  // Pointer + scroll parallax via CSS variables (rAF-throttled, motion-gated).
  useEffect(() => {
    const root = rootRef.current
    if (!root || !window.matchMedia) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const finePointer = window.matchMedia('(pointer: fine)').matches
    let frame = 0
    let px = 0
    let py = 0

    const apply = () => {
      frame = 0
      root.style.setProperty('--px', px.toFixed(3))
      root.style.setProperty('--py', py.toFixed(3))
      root.style.setProperty('--sy', Math.min(window.scrollY, 1200).toFixed(0))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }
    const onPointer = (event: PointerEvent) => {
      px = (event.clientX / window.innerWidth - 0.5) * 2
      py = (event.clientY / window.innerHeight - 0.5) * 2
      schedule()
    }

    if (finePointer) window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      if (finePointer) window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', schedule)
    }
  }, [])

  return (
    <div ref={rootRef} className={`page-background page-background-${variant}`} aria-hidden="true">
      <div className="page-bg-mesh" />
      <div className="page-bg-aurora" />

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

      <div className="page-bg-trail page-bg-trail-1" />
      <div className="page-bg-trail page-bg-trail-2" />
      <div className="page-bg-trail page-bg-trail-3" />

      <AmbientCanvas density={variant === 'sparkles' || variant === 'particles' ? 1.15 : 0.85} />
      <FloatingShapes shapes={SHAPES[variant] ?? SHAPES.aurora} />
    </div>
  )
}
