export type FixedTypeFilter = 'todos' | 'despesa' | 'receita'

interface TypeFilterPillsProps {
  value: FixedTypeFilter
  onChange: (value: FixedTypeFilter) => void
  counts: Record<FixedTypeFilter, number>
}

/** Filtro segmentado Todos/Despesas/Receitas com contagens (substitui o Select). */
export function TypeFilterPills({ value, onChange, counts }: TypeFilterPillsProps) {
  const options: Array<{ key: FixedTypeFilter; label: string }> = [
    { key: 'todos', label: 'Todos' },
    { key: 'despesa', label: 'Despesas' },
    { key: 'receita', label: 'Receitas' },
  ]
  return (
    <div className="mb-3 inline-flex gap-1 rounded-full border border-line bg-surface p-1">
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
            {option.label} <span className={active ? 'opacity-60' : 'text-muted'}>{counts[option.key]}</span>
          </button>
        )
      })}
    </div>
  )
}
