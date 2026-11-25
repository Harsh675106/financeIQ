'use client'

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/hooks/useReducedMotion'

interface ConfettiProps {
  trigger: boolean
  onComplete?: () => void
}

export default function ConfettiEffect({ trigger, onComplete }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!trigger) return

    // Reduced motion: skip the particle burst but still signal completion,
    // so the trigger resets exactly as it does after the animation.
    if (prefersReducedMotion()) {
      if (onComplete) onComplete()
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: {
      x: number
      y: number
      vx: number
      vy: number
      color: string
      size: number
      rotation: number
      vRot: number
      opacity: number
    }[] = []

    // Mint & Ice palette (saturated enough to read on a light canvas):
    // emerald, deep emerald, mint, ice blue, sky, amber, warm amber
    const colors = ['#10b981', '#059669', '#34d399', '#38bdf8', '#0ea5e9', '#f59e0b', '#fbbf24']

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 300,
        y: canvas.height * 0.4 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * -12 - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        opacity: 1,
      })
    }

    let animationId: number
    let frameCount = 0

    const render = () => {
      frameCount++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let stillActive = false

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.28 // gravity
        p.vx *= 0.98
        p.rotation += p.vRot
        p.opacity -= 0.012

        if (p.opacity > 0) {
          stillActive = true
          ctx.save()
          ctx.globalAlpha = Math.max(0, p.opacity)
          ctx.translate(p.x, p.y)
          ctx.rotate((p.rotation * Math.PI) / 180)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
          ctx.restore()
        }
      })

      if (stillActive && frameCount < 140) {
        animationId = requestAnimationFrame(render)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (onComplete) onComplete()
      }
    }

    animationId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationId)
      if (canvas) {
        const c = canvas.getContext('2d')
        if (c) c.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [trigger, onComplete])

  if (!trigger) return null

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[160] h-full w-full"
      aria-hidden="true"
    />
  )
}
