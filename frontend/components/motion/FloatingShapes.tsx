import type { CSSProperties } from 'react'

export type ShapeKind = 'cube' | 'ring' | 'orb' | 'tile'

export interface ShapeSpec {
  kind: ShapeKind
  /** Size in px. */
  size: number
  /** CSS position (top/left/right/bottom). */
  style: CSSProperties
  /** Animation delay in seconds (stagger). */
  delay?: number
  /** Hide below the md breakpoint to keep small screens clean. */
  desktopOnly?: boolean
}

const FACES = ['front', 'back', 'right', 'left', 'top', 'bottom'] as const

function Cube({ size }: { size: number }) {
  return (
    <div className="shape-cube" style={{ ['--s' as string]: `${size}px` }}>
      {FACES.map((face) => (
        <span key={face} className={`shape-cube-face shape-cube-${face}`} />
      ))}
    </div>
  )
}

/**
 * Decorative 3D geometric objects (pure CSS 3D transforms, soft lighting).
 * Inert: aria-hidden, pointer-events none. Motion is gated by prefers-reduced-motion in CSS.
 */
export default function FloatingShapes({ shapes, className = '' }: { shapes: ShapeSpec[]; className?: string }) {
  return (
    <div className={`floating-shapes ${className}`} aria-hidden="true">
      {shapes.map((shape, index) => (
        <div
          key={index}
          className={`floating-shape ${shape.desktopOnly ? 'hidden md:block' : ''}`}
          style={{ ...shape.style, width: shape.size, height: shape.size, animationDelay: `${shape.delay ?? 0}s` }}
        >
          {shape.kind === 'cube' && <Cube size={shape.size} />}
          {shape.kind === 'ring' && <div className="shape-ring" />}
          {shape.kind === 'orb' && (
            <>
              <div className="shape-orb" />
              <div className="shape-orb-shadow" />
            </>
          )}
          {shape.kind === 'tile' && <div className="shape-tile" />}
        </div>
      ))}
    </div>
  )
}
