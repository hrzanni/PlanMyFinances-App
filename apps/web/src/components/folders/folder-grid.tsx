import { EmptyState } from '@pmf/ui-web'
import { FolderCard, type FolderRow } from './folder-card'

export function FolderGrid({
  folders,
  emptyTitle,
  emptyHint,
  onOpen,
}: {
  folders: FolderRow[]
  emptyTitle: string
  emptyHint?: string
  onOpen: (folder: FolderRow) => void
}) {
  if (folders.length === 0) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {folders.map((folder, i) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          style={{ animationDelay: `${Math.min(i, 8) * 0.03}s` }}
          onOpen={() => onOpen(folder)}
        />
      ))}
    </div>
  )
}
