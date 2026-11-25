/**
 * Shared Recharts theme for FinanceIQ ("Mint & Ice" light theme).
 *
 * Axis ticks, grid lines, cursors and default tooltips are also themed
 * globally in app/globals.css, so charts stay consistent even where a
 * prop is not set. Use these constants for series colours and gradients.
 *
 * Key names are stable across themes — components reference them by role
 * (brand, positive, negative …), not by hue.
 */

export const chartColors = {
  /** Primary series (brand emerald). */
  brand: '#10b981',
  brandStrong: '#059669',
  brandSoft: '#6ee7b7',
  /** Secondary series (ice blue). */
  ice: '#38bdf8',
  iceStrong: '#0ea5e9',
  /** Kept for existing references: AI / tertiary series. */
  violet: '#6366f1',
  cyan: '#06b6d4',
  sky: '#38bdf8',
  teal: '#14b8a6',
  positive: '#10b981',
  positiveStrong: '#059669',
  negative: '#f43f5e',
  negativeStrong: '#e11d48',
  warning: '#f59e0b',
  orange: '#f97316',
  pink: '#ec4899',
  lime: '#84cc16',
  axis: '#64748b',
  grid: '#e6efec',
  muted: '#cbd8d5',
  /** Background behind marks (donut separators, active-dot rings). */
  surface: '#ffffff',
  text: '#172b2a',
} as const

/** Categorical palette — ordered for maximum adjacent contrast on white. */
export const chartPalette = [
  '#10b981', // emerald
  '#38bdf8', // ice blue
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#14b8a6', // teal
  '#ec4899', // pink
  '#0ea5e9', // sky
  '#8b5cf6', // violet
  '#f97316', // orange
  '#84cc16', // lime
] as const

export const axisTick = { fontSize: 11, fill: chartColors.axis }

export const axisProps = {
  tick: axisTick,
  axisLine: false,
  tickLine: false,
} as const

export const gridProps = {
  stroke: chartColors.grid,
  strokeDasharray: '3 6',
  vertical: false,
} as const

export const tooltipCursor = { stroke: 'rgba(5, 150, 105, 0.35)', strokeWidth: 1, strokeDasharray: '4 4' }
export const barCursor = { fill: 'rgba(16, 185, 129, 0.07)' }

export const activeDot = {
  r: 5,
  fill: chartColors.brand,
  stroke: chartColors.surface,
  strokeWidth: 2,
}

export const chartAnimation = {
  animationDuration: 1100,
  animationEasing: 'ease-out' as const,
}
