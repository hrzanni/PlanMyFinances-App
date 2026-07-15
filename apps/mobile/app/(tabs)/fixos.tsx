import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fixedPendingSummary } from '@pmf/core'
import { trpc } from '@/lib/trpc'
import { addMonths, currentMonth, monthLabel } from '@/lib/format'
import { confirmDelete } from '@/lib/confirm'
import { Button, EmptyState, ScreenTitle } from '@/components/ui'
import { FixedExpenseFormCard, type EditableFixedExpense } from '@/components/fixed-expense-form'
import { FixedKpis } from '@/components/fixed-kpis'
import { FixedTimeline, type FixedTimelineItemData } from '@/components/fixed-timeline'

type TypeFilter = 'todos' | 'despesa' | 'receita'

function TypeFilterPills({
  value,
  onChange,
  counts,
}: {
  value: TypeFilter
  onChange: (next: TypeFilter) => void
  counts: Record<TypeFilter, number>
}) {
  const options: Array<{ key: TypeFilter; label: string }> = [
    { key: 'todos', label: 'Todos' },
    { key: 'despesa', label: 'Despesas' },
    { key: 'receita', label: 'Receitas' },
  ]
  return (
    <View className="mb-3 flex-row self-start rounded-full border border-line bg-surface p-1 dark:border-line-dark dark:bg-surface-dark">
      {options.map((option) => {
        const active = value === option.key
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.key)}
            className={active ? 'rounded-full bg-foreground px-3.5 py-1.5 dark:bg-foreground-dark' : 'px-3.5 py-1.5'}
          >
            <Text
              className={`text-xs font-bold ${
                active ? 'text-background dark:text-background-dark' : 'text-body dark:text-body-dark'
              }`}
            >
              {option.label} {counts[option.key]}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export default function FixedExpensesScreen() {
  const [month, setMonth] = useState(currentMonth)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EditableFixedExpense | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos')
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const utils = trpc.useUtils()
  const list = trpc.fixedExpenses.list.useQuery({ month })
  const categories = trpc.categories.list.useQuery()
  const invalidate = () => {
    utils.fixedExpenses.invalidate()
    utils.transactions.invalidate()
    utils.dashboard.invalidate()
  }
  const pay = trpc.fixedExpenses.pay.useMutation({ onSuccess: invalidate })
  const unpay = trpc.fixedExpenses.unpay.useMutation({ onSuccess: invalidate })
  const del = trpc.fixedExpenses.delete.useMutation({ onSuccess: invalidate })

  const items = list.data?.items ?? []
  const counts = {
    todos: items.length,
    despesa: items.filter((i) => i.type === 'despesa').length,
    receita: items.filter((i) => i.type === 'receita').length,
  }
  const filteredItems = items.filter((i) => typeFilter === 'todos' || i.type === typeFilter)
  const pending = fixedPendingSummary(items)
  const categoryNames = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  )
  const monthAbbr = monthLabel(month).slice(0, 3).toLowerCase()

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-3" keyboardShouldPersistTaps="handled">
        <ScreenTitle>Fixos</ScreenTitle>

        <View className="mb-3 flex-row items-center justify-center gap-4 rounded-lg border border-line bg-surface py-2 dark:border-line-dark dark:bg-surface-dark">
          <Pressable onPress={() => setMonth(addMonths(month, -1))} accessibilityLabel="Mês anterior">
            <Text className="px-3 text-muted dark:text-muted-dark">◀</Text>
          </Pressable>
          <Text className="text-sm font-bold text-foreground dark:text-foreground-dark">
            {monthLabel(month)}
          </Text>
          <Pressable onPress={() => setMonth(addMonths(month, 1))} accessibilityLabel="Próximo mês">
            <Text className="px-3 text-muted dark:text-muted-dark">▶</Text>
          </Pressable>
        </View>

        <FixedKpis totals={list.data?.totals} pending={pending} />

        <TypeFilterPills value={typeFilter} onChange={setTypeFilter} counts={counts} />

        <View className="mt-3">
          {items.length === 0 ? (
            <EmptyState
              title="Nenhum fixo cadastrado"
              hint="Cadastre aluguel, contas, assinaturas e salário abaixo."
            />
          ) : filteredItems.length === 0 ? (
            <EmptyState title="Nenhum item para esse filtro" hint="Troque o filtro acima." />
          ) : (
            <FixedTimeline
              items={filteredItems as FixedTimelineItemData[]}
              month={month}
              today={today}
              monthAbbr={monthAbbr}
              categoryNames={categoryNames}
              mutating={pay.isPending || unpay.isPending}
              onToggle={(item, next) =>
                next ? pay.mutate({ id: item.id, month }) : unpay.mutate({ id: item.id, month })
              }
              onEdit={(item) => {
                setEditing(item as EditableFixedExpense)
                setFormOpen(true)
              }}
              onDelete={(item) =>
                confirmDelete(
                  'Excluir fixo',
                  `Excluir "${item.name}"? O histórico de pagamentos deste item será removido; as transações já criadas permanecem.`,
                  () => del.mutate({ id: item.id }),
                )
              }
            />
          )}
        </View>

        <View className="my-4">
          {formOpen ? (
            <FixedExpenseFormCard
              key={editing?.id ?? 'new'}
              editing={editing}
              onClose={closeForm}
            />
          ) : (
            <Button title="+ Novo fixo" onPress={() => setFormOpen(true)} />
          )}
        </View>

        <Text className="mb-8 text-[11px] leading-4 text-muted dark:text-muted-dark">
          Marcar como pago (ou recebido) cria a transação do mês automaticamente; desmarcar
          remove. Na virada do mês tudo volta a pendente e o histórico fica preservado — valores
          editados valem só do mês vigente em diante.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}
