interface FolderKpisProps {
  total: number
  active: number
  archived: number
}

/** Faixa de KPIs da tela Pastas: só contagens, sem total em R$ (decisão de escopo). */
export function FolderKpis({ total, active, archived }: FolderKpisProps) {
  const cells = [
    { label: 'Total de pastas', value: total },
    { label: 'Ativas', value: active },
    { label: 'Arquivadas', value: archived },
  ]
  return (
    <div className="mb-4 grid grid-cols-3 overflow-hidden rounded-xl border border-line bg-surface divide-x divide-line">
      {cells.map((cell) => (
        <div key={cell.label} className="px-4 py-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {cell.label}
          </div>
          <div className="mt-1 text-lg font-black tabular-nums text-foreground">{cell.value}</div>
        </div>
      ))}
    </div>
  )
}
