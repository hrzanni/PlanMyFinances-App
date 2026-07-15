import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Button, Input } from './ui'
import { trpc } from '@/lib/trpc'

export interface HistoryFilters {
  type?: 'receita' | 'despesa'
  categoryId?: string
  subcategoryId?: string
  folderId?: string
  dateFrom?: string
  dateTo?: string
}

interface Props {
  open: boolean
  onClose: () => void
  filters: HistoryFilters
  onApply: (next: HistoryFilters) => void
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Filtros avançados do histórico (categoria, subcategoria, pasta, período), paridade com o web. */
export function TxFilterSheet({ open, onClose, filters, onApply }: Props) {
  const { data: categories } = trpc.categories.list.useQuery(undefined, { enabled: open })
  const { data: folders } = trpc.folders.list.useQuery(undefined, { enabled: open })

  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [folderId, setFolderId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setCategoryId(filters.categoryId ?? '')
      setSubcategoryId(filters.subcategoryId ?? '')
      setFolderId(filters.folderId ?? '')
      setDateFrom(filters.dateFrom ?? '')
      setDateTo(filters.dateTo ?? '')
      setError(null)
    }
  }, [open, filters])

  const typeCategories = useMemo(
    () => (categories ?? []).filter((c) => !filters.type || c.type === filters.type),
    [categories, filters.type],
  )
  const subcategories = useMemo(
    () => typeCategories.find((c) => c.id === categoryId)?.subcategories ?? [],
    [typeCategories, categoryId],
  )
  const activeFolders = useMemo(
    () => (folders ?? []).filter((f) => f.status === 'active'),
    [folders],
  )

  function selectCategory(id: string) {
    setCategoryId(id)
    setSubcategoryId('')
  }

  function apply() {
    if (dateFrom && !DATE_RE.test(dateFrom)) return setError('Data "de" no formato AAAA-MM-DD')
    if (dateTo && !DATE_RE.test(dateTo)) return setError('Data "até" no formato AAAA-MM-DD')
    setError(null)
    onApply({
      type: filters.type,
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      folderId: folderId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
    onClose()
  }

  function clear() {
    setCategoryId('')
    setSubcategoryId('')
    setFolderId('')
    setDateFrom('')
    setDateTo('')
    setError(null)
    onApply({})
    onClose()
  }

  function Chip({
    active,
    label,
    onPress,
  }: {
    active: boolean
    label: string
    onPress: () => void
  }) {
    return (
      <Pressable
        onPress={onPress}
        className={`rounded-full border px-3 py-1.5 ${
          active
            ? 'border-foreground bg-foreground dark:border-foreground-dark dark:bg-foreground-dark'
            : 'border-line dark:border-line-dark'
        }`}
      >
        <Text
          className={`text-xs font-bold ${
            active
              ? 'text-background dark:text-background-dark'
              : 'text-body dark:text-body-dark'
          }`}
        >
          {label}
        </Text>
      </Pressable>
    )
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[88%] rounded-t-2xl bg-background p-5 dark:bg-background-dark">
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text className="mb-4 text-base font-black text-foreground dark:text-foreground-dark">
              Filtros
            </Text>

            <Text className="mb-1 text-xs font-bold text-foreground dark:text-foreground-dark">
              Categoria
            </Text>
            <View className="mb-3 flex-row flex-wrap gap-2">
              <Chip active={categoryId === ''} label="Todas" onPress={() => selectCategory('')} />
              {typeCategories.map((c) => (
                <Chip
                  key={c.id}
                  active={categoryId === c.id}
                  label={c.name}
                  onPress={() => selectCategory(c.id)}
                />
              ))}
            </View>

            {subcategories.length > 0 ? (
              <>
                <Text className="mb-1 text-xs font-bold text-foreground dark:text-foreground-dark">
                  Subcategoria
                </Text>
                <View className="mb-3 flex-row flex-wrap gap-2">
                  <Chip
                    active={subcategoryId === ''}
                    label="Todas"
                    onPress={() => setSubcategoryId('')}
                  />
                  {subcategories.map((s) => (
                    <Chip
                      key={s.id}
                      active={subcategoryId === s.id}
                      label={s.name}
                      onPress={() => setSubcategoryId(s.id)}
                    />
                  ))}
                </View>
              </>
            ) : null}

            {activeFolders.length > 0 ? (
              <>
                <Text className="mb-1 text-xs font-bold text-foreground dark:text-foreground-dark">
                  Pasta
                </Text>
                <View className="mb-3 flex-row flex-wrap gap-2">
                  <Chip active={folderId === ''} label="Todas" onPress={() => setFolderId('')} />
                  {activeFolders.map((f) => (
                    <Chip
                      key={f.id}
                      active={folderId === f.id}
                      label={`${f.icon ? `${f.icon} ` : ''}${f.name}`}
                      onPress={() => setFolderId(f.id)}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <Input
              label="De (AAAA-MM-DD)"
              placeholder="AAAA-MM-DD"
              value={dateFrom}
              onChangeText={setDateFrom}
            />
            <Input
              label="Até (AAAA-MM-DD)"
              placeholder="AAAA-MM-DD"
              value={dateTo}
              onChangeText={setDateTo}
            />

            {error ? (
              <Text className="mb-3 text-xs font-bold text-negative dark:text-negative-dark">
                {error}
              </Text>
            ) : null}

            <Button title="Aplicar filtros" onPress={apply} />
            <View className="h-2" />
            <Button title="Limpar filtros" variant="ghost" onPress={clear} />
            <View className="h-2" />
            <Button title="Cancelar" variant="ghost" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
