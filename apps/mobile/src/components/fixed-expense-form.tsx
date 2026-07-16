import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { trpc } from '@/lib/trpc'
import { addMonths, monthLabel } from '@/lib/format'
import { Button, Card, Input } from './ui'

export interface EditableFixedExpense {
  id: string
  name: string
  amount: string
  dueDay: number
  categoryId: string | null
  type: 'despesa' | 'receita'
}

/** Criar/editar fixo (despesa ou receita). Reajuste de valor pede a partir de qual mês vale (FR-105). */
export function FixedExpenseFormCard({
  editing,
  month,
  onClose,
}: {
  editing: EditableFixedExpense | null
  /** Mês atualmente visualizado na tela; usado como default do reajuste. */
  month: string
  onClose: () => void
}) {
  const utils = trpc.useUtils()
  const { data: categories } = trpc.categories.list.useQuery()

  const [name, setName] = useState(editing?.name ?? '')
  const [amount, setAmount] = useState(
    editing ? String(Number(editing.amount)).replace('.', ',') : '',
  )
  const [dueDay, setDueDay] = useState(String(editing?.dueDay ?? 5))
  const [type, setType] = useState<'despesa' | 'receita'>(editing?.type ?? 'despesa')
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? '')
  const [amountEffectiveFrom, setAmountEffectiveFrom] = useState(month)
  const [error, setError] = useState<string | null>(null)

  const filteredCategories = (categories ?? []).filter((c) => c.type === type)

  function selectType(next: 'despesa' | 'receita') {
    setType(next)
    setCategoryId('')
  }

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

  const amountChanged = editing != null && Number(amount.replace(',', '.')) !== Number(editing.amount)

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
      type,
      categoryId: categoryId || undefined,
    }
    if (editing) {
      update.mutate({
        id: editing.id,
        ...payload,
        ...(amountChanged ? { amountEffectiveFrom } : {}),
      })
    } else create.mutate(payload)
  }

  function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
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
            active ? 'text-background dark:text-background-dark' : 'text-body dark:text-body-dark'
          }`}
        >
          {label}
        </Text>
      </Pressable>
    )
  }

  return (
    <Card>
      <Text className="mb-3 text-sm font-black text-foreground dark:text-foreground-dark">
        {editing ? 'Editar fixo' : 'Novo fixo'}
      </Text>
      {editing ? (
        <Text className="mb-3 text-[11px] leading-4 text-muted dark:text-muted-dark">
          Mudar o valor é um reajuste: meses anteriores ao mês escolhido abaixo mantêm o valor
          atual, mesmo que ainda não estejam pagos.
        </Text>
      ) : null}
      <Input label="Nome" value={name} onChangeText={setName} />
      <View className="mb-3 flex-row gap-2">
        <Chip active={type === 'despesa'} label="Despesa" onPress={() => selectType('despesa')} />
        <Chip active={type === 'receita'} label="Receita" onPress={() => selectType('receita')} />
      </View>
      <Input
        label="Valor mensal (R$)"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      {amountChanged ? (
        <View className="mb-3">
          <Text className="mb-1 text-xs font-bold text-foreground dark:text-foreground-dark">
            A partir de qual mês vale esse novo valor?
          </Text>
          <View className="flex-row items-center justify-center gap-4 rounded-lg border border-line bg-surface py-2 dark:border-line-dark dark:bg-surface-dark">
            <Pressable
              onPress={() => setAmountEffectiveFrom(addMonths(amountEffectiveFrom, -1))}
              accessibilityLabel="Mês anterior"
            >
              <Text className="px-3 text-muted dark:text-muted-dark">◀</Text>
            </Pressable>
            <Text className="text-sm font-bold text-foreground dark:text-foreground-dark">
              {monthLabel(amountEffectiveFrom)}
            </Text>
            <Pressable
              onPress={() => setAmountEffectiveFrom(addMonths(amountEffectiveFrom, 1))}
              accessibilityLabel="Próximo mês"
            >
              <Text className="px-3 text-muted dark:text-muted-dark">▶</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <Input
        label="Dia do vencimento"
        keyboardType="number-pad"
        value={dueDay}
        onChangeText={setDueDay}
      />
      <Text className="mb-1 text-xs font-bold text-foreground dark:text-foreground-dark">
        Categoria (para a {type === 'receita' ? 'receita' : 'despesa'} gerada)
      </Text>
      <View className="mb-3 flex-row flex-wrap gap-2">
        {[{ id: '', name: 'Sem categoria' }, ...filteredCategories].map((c) => (
          <Chip
            key={c.id || 'none'}
            active={categoryId === c.id}
            label={c.name}
            onPress={() => setCategoryId(c.id)}
          />
        ))}
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
