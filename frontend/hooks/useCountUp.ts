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
  const [value, setValue] = useState<number>(startVal)
  const startTimeRef = useRef<number | null>(null)
  const initialValueRef = useRef<number>(startVal)
  const targetValueRef = useRef<number>(endValue)

  useEffect(() => {
    initialValueRef.current = value
    targetValueRef.current = endValue
    startTimeRef.current = null

    if (initialValueRef.current === endValue) {
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
  }, [endValue, duration, decimals])

  return value
}
