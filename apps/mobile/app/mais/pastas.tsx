import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { trpc } from '@/lib/trpc'
import { money } from '@/lib/format'
import { Badge, Button, Card, EmptyState, Input } from '@/components/ui'
import { TxRow } from '@/components/tx-row'

function FolderCard({ id, name, icon, status, totalSpent, txCount }: {
  id: string
  name: string
  icon: string | null
  status: 'active' | 'archived'
  totalSpent: string
  txCount: number
}) {
  const [expanded, setExpanded] = useState(false)
  const txs = trpc.transactions.list.useQuery({ folderId: id, limit: 10 }, { enabled: expanded })

  return (
    <Card className="mb-3">
      <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-sm font-bold text-foreground dark:text-foreground-dark">
            {icon ? `${icon} ` : ''}
            {name}
          </Text>
          <Badge tone={status === 'active' ? 'info' : 'neutral'} label={status === 'active' ? 'ativa' : 'arquivada'} />
          <Text className="text-xs text-muted dark:text-muted-dark">{expanded ? '▴' : '▾'}</Text>
        </View>
        <View className="mt-1 flex-row items-baseline gap-2">
          <Text className="text-lg font-black tabular-nums text-foreground dark:text-foreground-dark">
            {money(totalSpent)}
          </Text>
          <Text className="text-[11px] text-muted dark:text-muted-dark">
            total gasto · {txCount} transaç{txCount === 1 ? 'ão' : 'ões'}
          </Text>
        </View>
      </Pressable>
      {expanded ? (
        <View className="mt-2 border-t border-line pt-1 dark:border-line-dark">
          {txs.data && txs.data.items.length > 0 ? (
            txs.data.items.map((tx) => <TxRow key={tx.id} tx={tx} />)
          ) : (
            <Text className="py-3 text-xs text-muted dark:text-muted-dark">
              Nenhuma transação nesta pasta.
            </Text>
          )}
        </View>
      ) : null}
    </Card>
  )
}

export default function FoldersScreen() {
  const { data: folders } = trpc.folders.list.useQuery()
  const utils = trpc.useUtils()
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [error, setError] = useState<string | null>(null)

  const create = trpc.folders.create.useMutation({
    onSuccess: () => {
      utils.folders.invalidate()
      setFormOpen(false)
      setName('')
      setIcon('')
    },
    onError: () => setError('Erro ao salvar. Tente novamente.'),
  })

  function submit() {
    setError(null)
    if (!name.trim()) return setError('Informe o nome')
    create.mutate({ name: name.trim(), icon: icon || undefined })
  }

  return (
    <ScrollView className="flex-1 px-4 pt-3" keyboardShouldPersistTaps="handled">
      {folders && folders.length > 0 ? (
        folders.map((f) => (
          <FolderCard
            key={f.id}
            id={f.id}
            name={f.name}
            icon={f.icon}
            status={f.status}
            totalSpent={f.totalSpent}
            txCount={f.txCount}
          />
        ))
      ) : (
        <EmptyState title="Nenhuma pasta" hint='Crie "Viagem Chile" e associe despesas.' />
      )}

      <View className="my-4">
        {formOpen ? (
          <Card>
            <Input label="Nome" value={name} onChangeText={setName} />
            <Input label="Emoji (opcional)" value={icon} onChangeText={setIcon} maxLength={4} />
            {error ? (
              <Text className="mb-2 text-xs font-bold text-negative dark:text-negative-dark">
                {error}
              </Text>
            ) : null}
            <Button
              title={create.isPending ? 'Salvando…' : 'Criar pasta'}
              onPress={submit}
              disabled={create.isPending}
            />
            <View className="h-2" />
            <Button title="Cancelar" variant="ghost" onPress={() => setFormOpen(false)} />
          </Card>
        ) : (
          <Button title="+ Nova pasta" onPress={() => setFormOpen(true)} />
        )}
      </View>
    </ScrollView>
  )
}
