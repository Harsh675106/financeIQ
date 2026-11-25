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
  /** Fraction of the element that must be visible before revealing. */
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
  threshold = 0.12,
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
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -6% 0px' }
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
