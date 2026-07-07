'use client'

import { addMonths, monthLabel } from '@/lib/format'

export function MonthSelector({
  month,
  onChange,
}: {
  month: string
  onChange: (month: string) => void
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-bold text-foreground">
      <button
        type="button"
        aria-label="Mês anterior"
        onClick={() => onChange(addMonths(month, -1))}
        className="text-muted hover:text-foreground"
      >
        ◀
      </button>
      <span className="min-w-32 text-center tabular-nums">{monthLabel(month)}</span>
      <button
        type="button"
        aria-label="Próximo mês"
        onClick={() => onChange(addMonths(month, 1))}
        className="text-muted hover:text-foreground"
      >
        ▶
      </button>
    </div>
  )
}
