import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { trpc } from '@/lib/trpc'
import { Button, Card, Input } from './ui'

export interface EditableFixedExpense {
  id: string
  name: string
  amount: string
  dueDay: number
  categoryId: string | null
}

/** Criar/editar gasto fixo. Ao editar valor, vale do mês vigente em diante (FR-105). */
export function FixedExpenseFormCard({
  editing,
  onClose,
}: {
  editing: EditableFixedExpense | null
  onClose: () => void
}) {
  const utils = trpc.useUtils()
  const { data: categories } = trpc.categories.list.useQuery()
  const expenseCategories = (categories ?? []).filter((c) => c.type === 'despesa')

  const [name, setName] = useState(editing?.name ?? '')
  const [amount, setAmount] = useState(
    editing ? String(Number(editing.amount)).replace('.', ',') : '',
  )
  const [dueDay, setDueDay] = useState(String(editing?.dueDay ?? 5))
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? '')
  const [error, setError] = useState<string | null>(null)

  const onDone = () => {
    utils.fixedExpenses.invalidate()
    utils.transactions.invalidate()
    utils.dashboard.invalidate()
    onClose()
  }
  const onError = () => setError('Erro ao salvar. Tente novamente.')
  const create = trpc.fixedExpenses.create.useMutation({ onSuccess: onDone, onError })
  const update = trpc.fixedExpenses.update.useMutation({ onSuccess: onDone, onError })
  const isPending = create.isPending || update.isPending

  function submit() {
    setError(null)
    const parsed = Number(amount.replace(',', '.'))
    const day = Number(dueDay)
    if (!name.trim()) return setError('Informe o nome')
    if (!parsed || parsed <= 0) return setError('Valor maior que zero')
    if (!day || day < 1 || day > 31) return setError('Dia entre 1 e 31')

    const payload = {
      name: name.trim(),
      amount: parsed,
      dueDay: day,
      categoryId: categoryId || undefined,
    }
    if (editing) update.mutate({ id: editing.id, ...payload })
    else create.mutate(payload)
  }

  return (
    <Card>
      <Text className="mb-3 text-sm font-black text-foreground dark:text-foreground-dark">
        {editing ? 'Editar gasto fixo' : 'Novo gasto fixo'}
      </Text>
      {editing ? (
        <Text className="mb-3 text-[11px] leading-4 text-muted dark:text-muted-dark">
          Mudança de valor vale do mês vigente em diante; meses já pagos guardam o valor da época.
        </Text>
      ) : null}
      <Input label="Nome" value={name} onChangeText={setName} />
      <Input
        label="Valor mensal (R$)"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <Input
        label="Dia do vencimento"
        keyboardType="number-pad"
        value={dueDay}
        onChangeText={setDueDay}
      />
      <Text className="mb-1 text-xs font-bold text-foreground dark:text-foreground-dark">
        Categoria (para a despesa gerada)
      </Text>
      <View className="mb-3 flex-row flex-wrap gap-2">
        {[{ id: '', name: 'Sem categoria' }, ...expenseCategories].map((c) => {
          const active = categoryId === c.id
          return (
            <Pressable
              key={c.id || 'none'}
              onPress={() => setCategoryId(c.id)}
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
                {c.name}
              </Text>
            </Pressable>
          )
        })}
      </View>
      {error ? (
        <Text className="mb-2 text-xs font-bold text-negative dark:text-negative-dark">
          {error}
        </Text>
      ) : null}
      <Button title={isPending ? 'Salvando…' : 'Salvar'} onPress={submit} disabled={isPending} />
      <View className="h-2" />
      <Button title="Cancelar" variant="ghost" onPress={onClose} />
    </Card>
  )
}
