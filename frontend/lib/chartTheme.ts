/**
 * Shared Recharts theme for FinanceIQ ("Obsidian Aurora").
 *
 * Axis ticks, grid lines, cursors and default tooltips are also themed
 * globally in app/globals.css, so charts stay consistent even where a
 * prop is not set. Use these constants for series colours and gradients.
 */

export const chartColors = {
  brand: '#8a88fb',
  brandStrong: '#7068f4',
  brandSoft: '#a9acff',
  violet: '#a78bfa',
  cyan: '#22d3ee',
  sky: '#38bdf8',
  positive: '#34d399',
  positiveStrong: '#10b981',
  negative: '#fb7185',
  negativeStrong: '#f43f5e',
  warning: '#fbbf24',
  pink: '#f472b6',
  lime: '#a3e635',
  axis: '#7d86a8',
  grid: 'rgba(255, 255, 255, 0.06)',
  muted: '#4a5170',
  surface: '#090b17',
  text: '#eef0f8',
} as const

/** Categorical palette — ordered for maximum adjacent contrast. */
export const chartPalette = [
  '#8a88fb', // iris
  '#22d3ee', // cyan
  '#34d399', // mint
  '#f472b6', // pink
  '#fbbf24', // amber
  '#a78bfa', // violet
  '#38bdf8', // sky
  '#fb7185', // rose
  '#a3e635', // lime
  '#2dd4bf', // teal
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

export const tooltipCursor = { stroke: 'rgba(169, 172, 255, 0.35)', strokeWidth: 1, strokeDasharray: '4 4' }
export const barCursor = { fill: 'rgba(169, 172, 255, 0.06)' }

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
