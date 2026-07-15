import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { trpc, type RouterOutputs } from '@/lib/trpc'
import { confirmDelete } from '@/lib/confirm'
import { Button, EmptyState, ScreenTitle } from '@/components/ui'
import { TxRow } from '@/components/tx-row'
import { TxFormModal } from '@/components/tx-form-modal'
import { TxFilterSheet, type HistoryFilters } from '@/components/tx-filter-sheet'

type TransactionItem = RouterOutputs['transactions']['list']['items'][number]

type TypeFilter = 'todas' | 'receita' | 'despesa'

const EXTRA_FILTER_KEYS = ['categoryId', 'subcategoryId', 'folderId', 'dateFrom', 'dateTo'] as const

/**
 * Histórico com FlashList virtualizada (ME-001) e paginação por cursor (ME-002).
 * Filtros vivem no estado da tela (FR-005, equivalente mobile): tipo como chips de
 * atalho rápido, demais campos (categoria/subcategoria/pasta/período) no filter sheet.
 */
export default function HistoryScreen() {
  const [filters, setFilters] = useState<HistoryFilters>({})
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<TransactionItem | null>(null)

  const query = trpc.transactions.list.useInfiniteQuery(
    { limit: 30, ...filters },
    { getNextPageParam: (last) => last.nextCursor ?? undefined },
  )

  const utils = trpc.useUtils()
  const del = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      utils.transactions.invalidate()
      utils.dashboard.invalidate()
      utils.folders.invalidate()
    },
  })

  const items = query.data?.pages.flatMap((p) => p.items) ?? []
  const extraFilterCount = EXTRA_FILTER_KEYS.filter((key) => Boolean(filters[key])).length

  function FilterChip({ value, label }: { value: TypeFilter; label: string }) {
    const active = (filters.type ?? 'todas') === value
    return (
      <Pressable
        onPress={() => setFilters((prev) => ({ ...prev, type: value === 'todas' ? undefined : value }))}
        className={`rounded-full border px-3 py-1.5 ${
          active
            ? 'border-foreground bg-foreground dark:border-foreground-dark dark:bg-foreground-dark'
            : 'border-line dark:border-line-dark'
        }`}
      >
        <Text
          className={`text-xs font-bold ${
            active ? 'text-background dark:text-background-dark' : 'text-body dark:text-body-dark'
          }`}
        >
          {label}
        </Text>
      </Pressable>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <View className="flex-1 px-4 pt-3">
        <View className="mb-2 flex-row items-center justify-between">
          <ScreenTitle>Histórico</ScreenTitle>
          <Button
            title="+ Nova"
            onPress={() => {
              setEditingTx(null)
              setFormOpen(true)
            }}
          />
        </View>
        <View className="mb-3 flex-row flex-wrap items-center gap-2">
          <FilterChip value="todas" label="Todas" />
          <FilterChip value="receita" label="Receitas" />
          <FilterChip value="despesa" label="Despesas" />
          <Pressable
            onPress={() => setFilterSheetOpen(true)}
            className="rounded-full border border-line px-3 py-1.5 dark:border-line-dark"
          >
            <Text className="text-xs font-bold text-body dark:text-body-dark">
              {extraFilterCount > 0 ? `Filtros (${extraFilterCount})` : 'Filtros'}
            </Text>
          </Pressable>
        </View>

        {items.length === 0 && !query.isLoading ? (
          <EmptyState title="Nenhuma transação" hint="Ajuste o filtro ou crie uma nova." />
        ) : (
          <FlashList
            data={items}
            keyExtractor={(item) => item.id}
            estimatedItemSize={56}
            renderItem={({ item }) => (
              <TxRow
                tx={item}
                showDetails
                onEdit={() => {
                  setEditingTx(item)
                  setFormOpen(true)
                }}
                onDelete={() =>
                  confirmDelete('Excluir transação', 'Excluir esta transação?', () =>
                    del.mutate({ id: item.id }),
                  )
                }
              />
            )}
            onEndReached={() => {
              if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage()
            }}
            onEndReachedThreshold={0.4}
          />
        )}
      </View>
      <TxFormModal
        open={formOpen}
        editing={editingTx}
        onClose={() => {
          setFormOpen(false)
          setEditingTx(null)
        }}
      />
      <TxFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={filters}
        onApply={setFilters}
      />
    </SafeAreaView>
  )
}
