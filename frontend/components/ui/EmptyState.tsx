import type { ComponentType, ReactNode } from 'react'
import { iconToneClass, type IconTone } from '@/components/ui/tones'

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>
  tone?: IconTone
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}

/**
 * Friendly placeholder for lists / charts with no data yet.
 */
export default function EmptyState({
  icon: Icon,
  tone = 'brand',
  title,
  description,
  action,
  className = '',
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-12'} ${className}`}>
      {Icon && (
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-2xl bg-primary-500/20 blur-xl" />
          <span className={`icon-tile icon-tile-lg ${iconToneClass[tone]} relative`}>
            <Icon className="h-6 w-6" />
          </span>
        </div>
      )}
      <h3 className="font-display text-base font-semibold text-slate-50">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
