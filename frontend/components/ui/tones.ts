/**
 * Literal class maps so Tailwind's scanner always sees the full class names
 * (template strings like `badge-${tone}` would be purged).
 */

export type IconTone = 'brand' | 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose' | 'sky' | 'slate'
export type BadgeTone = 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'ai' | 'neutral'

export const iconToneClass: Record<IconTone, string> = {
  brand: 'icon-tile-brand',
  emerald: 'icon-tile-emerald',
  cyan: 'icon-tile-cyan',
  violet: 'icon-tile-violet',
  amber: 'icon-tile-amber',
  rose: 'icon-tile-rose',
  sky: 'icon-tile-sky',
  slate: 'icon-tile-slate',
}

export const badgeToneClass: Record<BadgeTone, string> = {
  brand: 'badge-brand',
  success: 'badge-success',
  danger: 'badge-danger',
  warning: 'badge-warning',
  info: 'badge-info',
  ai: 'badge-ai',
  neutral: 'badge-neutral',
}
