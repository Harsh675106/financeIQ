'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { m, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'

interface TiltCardProps {
  children: ReactNode
  className?: string
  /** Maximum tilt in degrees. */
  max?: number
  /** Show the moving light reflection. */
  glare?: boolean
  /** Lift towards the viewer while hovered (px). */
  lift?: number
}

const SPRING = { stiffness: 220, damping: 22, mass: 0.6 }

/**
 * Interactive 3D tilt with a soft moving reflection.
 *
 * - Only activates for fine pointers (mouse/trackpad) and when motion is welcome.
 * - Perspective is applied only while tilting and reset afterwards, so at rest
 *   the element has `transform: none`.
 * - Don't wrap content that renders fixed overlays or interactive charts
 *   (tilting moves their hit areas).
 */
export default function TiltCard({ children, className = '', max = 7, glare = true, lift = 6 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()
  const [finePointer, setFinePointer] = useState(false)

  const rotateX = useSpring(0, SPRING)
  const rotateY = useSpring(0, SPRING)
  const z = useSpring(0, SPRING)
  const perspective = useMotionValue(0)
  const glareX = useMotionValue(50)
  const glareY = useMotionValue(0)
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 })
  const glareBackground = useMotionTemplate`radial-gradient(420px circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.75), rgba(255,255,255,0) 55%)`

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(hover: hover) and (pointer: fine)')
    setFinePointer(mql.matches)
    const onChange = (event: MediaQueryListEvent) => setFinePointer(event.matches)
    mql.addEventListener?.('change', onChange)
    return () => mql.removeEventListener?.('change', onChange)
  }, [])

  // Drop perspective once the card has settled so the resting transform is `none`.
  useEffect(() => {
    const unsubscribe = rotateX.on('animationComplete', () => {
      if (rotateX.get() === 0 && rotateY.get() === 0) perspective.set(0)
    })
    return unsubscribe
  }, [rotateX, rotateY, perspective])

  const enabled = finePointer && !prefersReduced

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height
    perspective.set(900)
    rotateY.set((px - 0.5) * 2 * max)
    rotateX.set(-(py - 0.5) * 2 * max)
    z.set(lift)
    glareX.set(px * 100)
    glareY.set(py * 100)
    glareOpacity.set(1)
  }

  const handleLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
    z.set(0)
    glareOpacity.set(0)
  }

  if (!enabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <m.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`tilt-card ${className}`}
      style={{ rotateX, rotateY, z, transformPerspective: perspective, transformStyle: 'preserve-3d' }}
    >
      {children}
      {glare && (
        <m.span
          aria-hidden="true"
          className="tilt-card-glare"
          style={{ background: glareBackground, opacity: glareOpacity }}
        />
      )}
    </m.div>
  )
}
