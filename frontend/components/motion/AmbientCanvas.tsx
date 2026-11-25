'use client'

import { useEffect, useRef } from 'react'

interface AmbientCanvasProps {
  /** Multiplier on the particle count (1 = default). */
  density?: number
  /** Let particles react to and connect with the pointer. */
  interactive?: boolean
  className?: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  color: string
  alpha: number
  phase: number
}

const COLORS = ['16,185,129', '20,184,166', '56,189,248', '14,165,233', '52,211,153']
const LINK_DISTANCE = 128
const POINTER_RADIUS = 170
const MAX_SPEED = 0.42

/**
 * Floating glowing particles with subtle connecting lines.
 *
 * - One fixed, inert <canvas> (pointer-events: none) — never blocks clicks/scroll.
 * - ≤ 60 particles, DPR capped at 1.5, paused while the tab is hidden.
 * - Reduced motion: draws a single static frame, no animation loop.
 */
export default function AmbientCanvas({ density = 1, interactive = true, className = '' }: AmbientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const pointer = { x: -9999, y: -9999, active: false }
    let width = 0
    let height = 0
    let particles: Particle[] = []
    let frame = 0
    let running = false

    const spawn = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.24,
      vy: (Math.random() - 0.5) * 0.24,
      r: 1 + Math.random() * 1.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 0.35 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
    })

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const base = Math.min(60, Math.max(14, (width * height) / 26000))
      const target = Math.round(base * density * (coarsePointer ? 0.55 : 1))
      while (particles.length < target) particles.push(spawn())
      particles = particles.slice(0, target)
    }

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height)

      // Connecting lines between nearby particles.
      ctx.lineWidth = 0.8
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist2 = dx * dx + dy * dy
          if (dist2 < LINK_DISTANCE * LINK_DISTANCE) {
            const alpha = (1 - Math.sqrt(dist2) / LINK_DISTANCE) * 0.2
            ctx.strokeStyle = `rgba(16,185,129,${alpha.toFixed(3)})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // Lines to the pointer.
      if (pointer.active) {
        for (const p of particles) {
          const dx = p.x - pointer.x
          const dy = p.y - pointer.y
          const dist = Math.hypot(dx, dy)
          if (dist < POINTER_RADIUS) {
            ctx.strokeStyle = `rgba(14,165,233,${((1 - dist / POINTER_RADIUS) * 0.32).toFixed(3)})`
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(pointer.x, pointer.y)
            ctx.stroke()
          }
        }
      }

      // Particles with a soft glow halo.
      for (const p of particles) {
        const twinkle = 0.75 + 0.25 * Math.sin(time * 0.0012 + p.phase)
        ctx.fillStyle = `rgba(${p.color},${(p.alpha * 0.14 * twinkle).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(${p.color},${(p.alpha * twinkle).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const step = () => {
      for (const p of particles) {
        if (pointer.active) {
          const dx = p.x - pointer.x
          const dy = p.y - pointer.y
          const dist = Math.hypot(dx, dy) || 1
          if (dist < POINTER_RADIUS * 0.6) {
            // Gentle repulsion so particles part around the cursor.
            p.vx += (dx / dist) * 0.012
            p.vy += (dy / dist) * 0.012
          }
        }
        const speed = Math.hypot(p.vx, p.vy)
        if (speed > MAX_SPEED) {
          p.vx = (p.vx / speed) * MAX_SPEED
          p.vy = (p.vy / speed) * MAX_SPEED
        } else if (speed < 0.05) {
          p.vx += (Math.random() - 0.5) * 0.02
          p.vy += (Math.random() - 0.5) * 0.02
        }
        p.vx *= 0.998
        p.vy *= 0.998
        p.x += p.vx
        p.y += p.vy
        if (p.x < -12) p.x = width + 12
        else if (p.x > width + 12) p.x = -12
        if (p.y < -12) p.y = height + 12
        else if (p.y > height + 12) p.y = -12
      }
    }

    const loop = (time: number) => {
      step()
      draw(time)
      frame = requestAnimationFrame(loop)
    }

    const start = () => {
      if (running || reduceMotion) return
      running = true
      frame = requestAnimationFrame(loop)
    }

    const stop = () => {
      running = false
      cancelAnimationFrame(frame)
    }

    const onVisibility = () => (document.hidden ? stop() : start())
    const onResize = () => {
      resize()
      if (reduceMotion) draw(0)
    }
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.active = true
    }
    const onPointerLeave = () => {
      pointer.active = false
    }

    resize()
    draw(0)
    start()

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    const trackPointer = interactive && !coarsePointer && !reduceMotion
    if (trackPointer) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', onPointerLeave)
    }

    return () => {
      stop()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      if (trackPointer) {
        window.removeEventListener('pointermove', onPointerMove)
        document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      }
    }
  }, [density, interactive])

  return <canvas ref={canvasRef} className={`ambient-canvas ${className}`} aria-hidden="true" />
}
