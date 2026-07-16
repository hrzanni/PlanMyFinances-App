export type FolderStatusFilter = 'todas' | 'ativas' | 'arquivadas'

interface FolderStatusPillsProps {
  value: FolderStatusFilter
  onChange: (value: FolderStatusFilter) => void
  counts: Record<FolderStatusFilter, number>
}

/** Filtro segmentado Todas/Ativas/Arquivadas com contagens (mesmo padrão do filtro de tipo em Fixos). */
export function FolderStatusPills({ value, onChange, counts }: FolderStatusPillsProps) {
  const options: Array<{ key: FolderStatusFilter; label: string }> = [
    { key: 'todas', label: 'Todas' },
    { key: 'ativas', label: 'Ativas' },
    { key: 'arquivadas', label: 'Arquivadas' },
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
