'use client'

import { useState, useEffect, useRef } from 'react'

interface UseCountUpOptions {
  duration?: number
  decimals?: number
  startVal?: number
}

export function useCountUp(
  endValue: number,
  options: UseCountUpOptions = {}
): number {
  const { duration = 900, decimals = 0, startVal = 0 } = options
  const sanitizedStartVal = typeof startVal === 'number' && !isNaN(startVal) && isFinite(startVal) ? startVal : 0
  const sanitizedEndValue = typeof endValue === 'number' && !isNaN(endValue) && isFinite(endValue) ? endValue : sanitizedStartVal

  const [value, setValue] = useState<number>(sanitizedStartVal)
  const startTimeRef = useRef<number | null>(null)
  const initialValueRef = useRef<number>(sanitizedStartVal)
  const targetValueRef = useRef<number>(sanitizedEndValue)

  useEffect(() => {
    initialValueRef.current = value
    targetValueRef.current = sanitizedEndValue
    startTimeRef.current = null

    if (initialValueRef.current === sanitizedEndValue) {
      return
    }

    let animationFrameId: number

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3)
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)

      const current =
        initialValueRef.current +
        (targetValueRef.current - initialValueRef.current) * easedProgress

      if (decimals === 0) {
        setValue(Math.round(current))
      } else {
        const factor = Math.pow(10, decimals)
        setValue(Math.round(current * factor) / factor)
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        setValue(targetValueRef.current)
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [sanitizedEndValue, duration, decimals])

  return typeof value === 'number' && !isNaN(value) && isFinite(value) ? value : sanitizedEndValue
}
