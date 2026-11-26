'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

export type RevealVariant = 'rise' | 'tilt' | 'flip' | 'zoom'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Delay in ms before this element starts revealing (for staggering). */
  delay?: number
  /** rise = fade up · tilt = 3D tip-in on X · flip = 3D swing-in on Y · zoom = soft scale. */
  variant?: RevealVariant
  as?: 'div' | 'section' | 'li' | 'article'
  /**
   * Fraction of the element that must be visible before revealing.
   * Defaults to 0 (any overlap) — a section taller than the viewport can never
   * reach a higher ratio, and would otherwise stay hidden forever.
   */
  threshold?: number
  style?: CSSProperties
}

const variantClass: Record<RevealVariant, string> = {
  rise: 'reveal-rise',
  tilt: 'reveal-tilt',
  flip: 'reveal-flip',
  zoom: 'reveal-zoom',
}

/**
 * Scroll-triggered 3D reveal.
 *
 * Pure CSS transitions driven by one IntersectionObserver. The resting state is
 * `transform: none`, so wrapped content never becomes a containing block for
 * fixed-position overlays once revealed. Reduced-motion users see a plain fade.
 */
export default function Reveal({
  children,
  className = '',
  delay = 0,
  variant = 'tilt',
  as: Tag = 'div',
  threshold = 0,
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    // Anything already on screen at mount reveals straight away, so content is
    // never left hidden if the observer doesn't fire.
    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.96 && rect.bottom > 0) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -4% 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${variantClass[variant]} ${visible ? 'is-visible' : ''} ${className}`}
      style={{ ...style, transitionDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </Tag>
  )
}
