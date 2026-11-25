import type { ReactNode } from 'react'

export interface ChartTooltipRow {
  label: ReactNode
  value: ReactNode
  color?: string
}

interface ChartTooltipCardProps {
  title?: ReactNode
  rows: ChartTooltipRow[]
  footer?: ReactNode
}

/**
 * Glass tooltip body for Recharts custom tooltips.
 * Usage inside a custom `content` renderer:
 *   <ChartTooltipCard title={label} rows={[{ label: 'Net worth', value: '₹1.2L', color: chartColors.brand }]} />
 */
export function ChartTooltipCard({ title, rows, footer }: ChartTooltipCardProps) {
  return (
    <div className="glass-strong min-w-[9rem] rounded-xl px-3 py-2.5 text-xs animate-pop-in">
      {title !== undefined && title !== null && title !== '' && (
        <p className="mb-1.5 text-[11px] font-medium text-slate-500">{title}</p>
      )}
      <div className="space-y-1">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-slate-600">
              {row.color && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color, boxShadow: `0 0 0 3px ${row.color}22` }}
                />
              )}
              {row.label}
            </span>
            <span className="font-semibold tabular-nums text-ink-900">{row.value}</span>
          </div>
        ))}
      </div>
      {footer && <div className="mt-2 border-t border-line pt-1.5 text-[11px] text-slate-500">{footer}</div>}
    </div>
  )
}

export default ChartTooltipCard
