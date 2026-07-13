import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Button, Input } from './ui'
import { trpc } from '@/lib/trpc'

/** Formulário de nova transação (FR-001/002/111) como modal nativo. */
export function TxFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils()
  const { data: categories } = trpc.categories.list.useQuery(undefined, { enabled: open })
  const { data: folders } = trpc.folders.list.useQuery(undefined, { enabled: open })

  const [type, setType] = useState<'receita' | 'despesa'>('despesa')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [folderId, setFolderId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const typeCategories = useMemo(
    () => (categories ?? []).filter((c) => c.type === type),
    [categories, type],
  )
  const activeFolders = useMemo(
    () => (folders ?? []).filter((f) => f.status === 'active'),
    [folders],
  )

  const create = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.invalidate()
      utils.dashboard.invalidate()
      utils.folders.invalidate()
      setValue('')
      setDescription('')
      onClose()
    },
    onError: () => setError('Erro ao salvar. Tente novamente.'),
  })

  function submit() {
    setError(null)
    const parsed = Number(value.replace(',', '.'))
    if (!parsed || parsed <= 0) return setError('Informe um valor maior que zero')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Data no formato AAAA-MM-DD')
    create.mutate({
      type,
      value: parsed,
      date,
      description: description || undefined,
      categoryId: categoryId || undefined,
      folderId: folderId || undefined,
    })
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
              Nova transação
            </Text>
            <View className="mb-3 flex-row gap-2">
              <Chip active={type === 'despesa'} label="Despesa" onPress={() => setType('despesa')} />
              <Chip active={type === 'receita'} label="Receita" onPress={() => setType('receita')} />
            </View>
            <Input label="Valor (R$)" keyboardType="decimal-pad" value={value} onChangeText={setValue} />
            <Input label="Data (AAAA-MM-DD)" value={date} onChangeText={setDate} />
            <Input label="Descrição (opcional)" value={description} onChangeText={setDescription} />

            <Text className="mb-1 text-xs font-bold text-foreground dark:text-foreground-dark">
              Categoria
            </Text>
            <View className="mb-3 flex-row flex-wrap gap-2">
              <Chip active={categoryId === ''} label="Sem categoria" onPress={() => setCategoryId('')} />
              {typeCategories.map((c) => (
                <Chip
                  key={c.id}
                  active={categoryId === c.id}
                  label={c.name}
                  onPress={() => setCategoryId(c.id)}
                />
              ))}
            </View>

            {activeFolders.length > 0 ? (
              <>
                <Text className="mb-1 text-xs font-bold text-foreground dark:text-foreground-dark">
                  Pasta (opcional)
                </Text>
                <View className="mb-3 flex-row flex-wrap gap-2">
                  <Chip active={folderId === ''} label="Nenhuma" onPress={() => setFolderId('')} />
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

            {error ? (
              <Text className="mb-3 text-xs font-bold text-negative dark:text-negative-dark">
                {error}
              </Text>
            ) : null}
            <Button
              title={create.isPending ? 'Salvando…' : 'Salvar transação'}
              onPress={submit}
              disabled={create.isPending}
            />
            <View className="h-2" />
            <Button title="Cancelar" variant="ghost" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
