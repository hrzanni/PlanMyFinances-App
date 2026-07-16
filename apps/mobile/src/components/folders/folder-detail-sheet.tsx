import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { trpc } from '@/lib/trpc'
import { money } from '@/lib/format'
import { confirmDelete } from '@/lib/confirm'
import { Button, EmptyState } from '@/components/ui'
import { TxRow } from '@/components/tx-row'
import type { FolderRow } from './folder-card'
import { FolderCategoryBreakdown } from './folder-category-breakdown'

interface FolderDetailSheetProps {
  folder: FolderRow | null
  onClose: () => void
  onEdit: (folder: FolderRow) => void
  onArchiveToggle: (folder: FolderRow) => void
  onDelete: (folder: FolderRow) => void
}

/** Bottom sheet de detalhe: nome/total, ações e a pasta inteira — sem ir pro Histórico. */
export function FolderDetailSheet({
  folder,
  onClose,
  onEdit,
  onArchiveToggle,
  onDelete,
}: FolderDetailSheetProps) {
  const query = trpc.transactions.list.useInfiniteQuery(
    { folderId: folder?.id, limit: 50 },
    { enabled: folder !== null, getNextPageParam: (last) => last.nextCursor ?? undefined },
  )
  const items = query.data?.pages.flatMap((p) => p.items) ?? []
  const archived = folder?.status === 'archived'

  return (
    <Modal visible={folder !== null} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[88%] rounded-t-2xl bg-background p-5 dark:bg-background-dark">
          {folder ? (
            <ScrollView keyboardShouldPersistTaps="handled">
              <View className="mb-1 flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-lg font-black text-foreground dark:text-foreground-dark">
                  {folder.name}
                </Text>
                <View className="flex-row items-center gap-4 pt-1">
                  <Pressable accessibilityLabel="Editar nome" hitSlop={8} onPress={() => onEdit(folder)}>
                    <Ionicons name="create-outline" size={18} color="#9C9B9B" />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={archived ? 'Reativar pasta' : 'Arquivar pasta'}
                    hitSlop={8}
                    onPress={() => onArchiveToggle(folder)}
                  >
                    <Ionicons
                      name={archived ? 'refresh-outline' : 'archive-outline'}
                      size={18}
                      color="#9C9B9B"
                    />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Excluir pasta"
                    hitSlop={8}
                    onPress={() =>
                      confirmDelete(
                        'Excluir pasta',
                        `Excluir a pasta "${folder.name}"? As transações continuam existindo, apenas sem pasta.`,
                        () => onDelete(folder),
                      )
                    }
                  >
                    <Ionicons name="trash-outline" size={18} color="#9C9B9B" />
                  </Pressable>
                </View>
              </View>
              <Text className="mb-5 text-2xl font-black tabular-nums text-foreground dark:text-foreground-dark">
                {money(folder.totalSpent)}
              </Text>

              <View className="mb-4">
                <FolderCategoryBreakdown folderId={folder.id} />
              </View>

              <View className="border-t border-dashed border-line pt-4 dark:border-line-dark">
                <Text className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted dark:text-muted-dark">
                  Transações ({items.length})
                </Text>
                {items.length === 0 ? (
                  <EmptyState
                    title="Nenhuma transação nesta pasta"
                    hint="Associe transações pelo formulário de nova transação."
                  />
                ) : (
                  items.map((tx) => <TxRow key={tx.id} tx={tx} />)
                )}
                {query.hasNextPage ? (
                  <View className="mt-3">
                    <Button
                      title={query.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
                      variant="ghost"
                      disabled={query.isFetchingNextPage}
                      onPress={() => query.fetchNextPage()}
                    />
                  </View>
                ) : null}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}
