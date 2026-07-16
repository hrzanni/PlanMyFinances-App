import { Badge } from '@pmf/ui-web'
import { money } from '@/lib/format'
import type { RouterOutputs } from '@/lib/trpc'
import { FolderIcon } from './folder-icon'

export type FolderRow = RouterOutputs['folders']['list'][number]

/** Card do grid: abre a gaveta de detalhe ao clicar. Sem expansão inline (quebraria a grade). */
export function FolderCard({
  folder,
  style,
  onOpen,
}: {
  folder: FolderRow
  style?: React.CSSProperties
  onOpen: () => void
}) {
  const archived = folder.status === 'archived'
  return (
    <button
      type="button"
      onClick={onOpen}
      style={style}
      className="animate-fade-slide-up rounded-2xl border border-line bg-surface p-4 text-left shadow-sm transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-2">
        <FolderIcon muted={archived} />
        <Badge tone={archived ? 'neutral' : 'info'}>{archived ? 'arquivada' : 'ativa'}</Badge>
      </div>
      <div className="mt-3 truncate text-sm font-bold text-foreground">{folder.name}</div>
      <div className="mt-0.5 text-xs text-muted">
        {folder.txCount} transaç{folder.txCount === 1 ? 'ão' : 'ões'}
      </div>
      <div className="mt-2.5 text-xl font-black tabular-nums text-foreground">
        {money(folder.totalSpent)}
      </div>
    </button>
  )
}
