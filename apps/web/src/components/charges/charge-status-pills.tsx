export type ChargeStatusFilter = 'todas' | 'pendentes' | 'atrasadas' | 'pagas'

interface ChargeStatusPillsProps {
  value: ChargeStatusFilter
  onChange: (value: ChargeStatusFilter) => void
  counts: Record<ChargeStatusFilter, number>
}

/** Filtro segmentado Todas/Pendentes/Atrasadas/Pagas (mesmo padrão do filtro de Pastas). */
export function ChargeStatusPills({ value, onChange, counts }: ChargeStatusPillsProps) {
  const options: Array<{ key: ChargeStatusFilter; label: string }> = [
    { key: 'todas', label: 'Todas' },
    { key: 'pendentes', label: 'Pendentes' },
    { key: 'atrasadas', label: 'Atrasadas' },
    { key: 'pagas', label: 'Pagas' },
  ]
  return (
    <div className="mb-4 inline-flex gap-1 rounded-full border border-line bg-surface p-1">
      {options.map((option) => {
        const active = value === option.key
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              active ? 'bg-foreground text-background' : 'text-body hover:text-foreground'
            }`}
          >
            {option.label}{' '}
            <span className={active ? 'opacity-60' : 'text-muted'}>{counts[option.key]}</span>
          </button>
        )
      })}
    </div>
  )
}
