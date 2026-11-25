'use client'

import type { ReactNode } from 'react'
import { AnimatePresence, m } from 'framer-motion'

interface SectionSwapProps {
  /** Changing this value plays the perspective transition (e.g. active tab id). */
  swapKey: string | number
  children: ReactNode
  className?: string
  /** 'turn' = swing on the Y axis like a page; 'flip' = tip over on the X axis. */
  mode?: 'turn' | 'flip'
}

const EASE = [0.16, 1, 0.3, 1] as const

const variants = {
  turn: {
    initial: { opacity: 0, rotateY: 10, x: 18, transformPerspective: 1400 },
    animate: { opacity: 1, rotateY: 0, x: 0, transformPerspective: 1400, transitionEnd: { transformPerspective: 0 } },
    exit: { opacity: 0, rotateY: -8, x: -14, transformPerspective: 1400 },
  },
  flip: {
    initial: { opacity: 0, rotateX: -14, y: 10, transformPerspective: 1200 },
    animate: { opacity: 1, rotateX: 0, y: 0, transformPerspective: 1200, transitionEnd: { transformPerspective: 0 } },
    exit: { opacity: 0, rotateX: 10, y: -6, transformPerspective: 1200 },
  },
}

/**
 * Perspective transition between alternative views (tabs, chart types, list/table).
 * Resets to `transform: none` after entering.
 */
export default function SectionSwap({ swapKey, children, className = '', mode = 'turn' }: SectionSwapProps) {
  const v = variants[mode]
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={swapKey}
        className={className}
        initial={v.initial}
        animate={v.animate}
        exit={v.exit}
        transition={{ duration: 0.38, ease: EASE }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  )
}
