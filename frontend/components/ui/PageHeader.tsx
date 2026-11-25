import type { ComponentType, ReactNode } from 'react'
import { badgeToneClass, type BadgeTone } from '@/components/ui/tones'

interface PageHeaderProps {
  /** Small badge above the title, e.g. "Intelligence Hub". */
  eyebrow?: ReactNode
  eyebrowIcon?: ComponentType<{ className?: string }>
  eyebrowTone?: BadgeTone
  /** Extra chips rendered next to the eyebrow (date, status, etc.). */
  meta?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** Buttons / controls aligned to the right on desktop. */
  actions?: ReactNode
  className?: string
}

/**
 * Consistent page title block used at the top of every dashboard page.
 */
export default function PageHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  eyebrowTone = 'brand',
  meta,
  title,
  description,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <header
      className={`relative flex flex-col gap-5 animate-fade-up md:flex-row md:items-end md:justify-between ${className}`}
    >
      <div className="min-w-0">
        {(eyebrow || meta) && (
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            {eyebrow && (
              <span className={`badge ${badgeToneClass[eyebrowTone]}`}>
                {EyebrowIcon && <EyebrowIcon className="h-3.5 w-3.5" />}
                {eyebrow}
              </span>
            )}
            {meta}
          </div>
        )}
        <h1 className="text-balance font-display text-2xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-[1.875rem]">
          {title}
        </h1>
        {description && (
          <p className="text-pretty mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-[15px]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div>}
    </header>
  )
}
