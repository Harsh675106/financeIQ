'use client'

import type { ReactNode } from 'react'
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'

/**
 * App-wide motion setup.
 * - LazyMotion + domAnimation keeps the Framer Motion bundle small (use `m.*`).
 * - reducedMotion="user" turns transform/layout animations into instant
 *   changes for people who prefer reduced motion (opacity still fades).
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user" transition={{ type: 'spring', stiffness: 260, damping: 28 }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
