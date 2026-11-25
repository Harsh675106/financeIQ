import type { ComponentType, ReactNode } from 'react'
import { iconToneClass, type IconTone } from '@/components/ui/tones'

export type { IconTone }

interface SectionHeaderProps {
  icon?: ComponentType<{ className?: string }>
  tone?: IconTone
  title: ReactNode
  subtitle?: ReactNode
  /** Controls aligned right (toggles, buttons, badges). */
  actions?: ReactNode
  /** Render the title as h2 (default) or h3. */
  as?: 'h2' | 'h3'
  className?: string
}

/**
 * Card / section heading: gradient icon tile + title + subtitle + actions.
 */
export default function SectionHeader({
  icon: Icon,
  tone = 'brand',
  title,
  subtitle,
  actions,
  as: Heading = 'h2',
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className={`icon-tile ${iconToneClass[tone]} icon-morph-container`}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
        <div className="min-w-0">
          <Heading className="card-title truncate">{title}</Heading>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
