import { View } from 'react-native'
import { EmptyState } from '@/components/ui'
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
    <View className="flex-row flex-wrap justify-between gap-y-2">
      {folders.map((folder) => (
        <FolderCard key={folder.id} folder={folder} onOpen={() => onOpen(folder)} />
      ))}
    </View>
  )
}
