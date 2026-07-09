import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { trpc } from '@/lib/trpc'
import { addMonths, currentMonth, money, monthLabel } from '@/lib/format'
import { confirmDelete } from '@/lib/confirm'
import { Badge, Button, Card, EmptyState, Kpi, ScreenTitle, Toggle } from '@/components/ui'
import { FixedExpenseFormCard, type EditableFixedExpense } from '@/components/fixed-expense-form'

const toneOf = { pago: 'paid', pendente: 'pending', vencido: 'late' } as const

export default function FixedExpensesScreen() {
  const [month, setMonth] = useState(currentMonth)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EditableFixedExpense | null>(null)

  const utils = trpc.useUtils()
  const list = trpc.fixedExpenses.list.useQuery({ month })
  const invalidate = () => {
    utils.fixedExpenses.invalidate()
    utils.transactions.invalidate()
    utils.dashboard.invalidate()
  }
  const pay = trpc.fixedExpenses.pay.useMutation({ onSuccess: invalidate })
  const unpay = trpc.fixedExpenses.unpay.useMutation({ onSuccess: invalidate })
  const del = trpc.fixedExpenses.delete.useMutation({ onSuccess: invalidate })

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-3" keyboardShouldPersistTaps="handled">
        <ScreenTitle>Gastos Fixos</ScreenTitle>

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

        <View className="mb-4 flex-row gap-2">
          <Kpi label="Pago" value={money(list.data?.totals.paid ?? 0)} tone="positive" />
          <Kpi label="Pendente" value={money(list.data?.totals.pending ?? 0)} tone="negative" />
        </View>

        {list.data && list.data.items.length > 0 ? (
          <Card>
            {list.data.items.map((item) => {
              const paid = item.monthlyStatus === 'pago'
              return (
                <View
                  key={item.id}
                  className="flex-row items-center gap-3 border-b border-line py-3 last:border-0 dark:border-line-dark"
                >
                  <View className="min-w-0 flex-1">
                    <Text className="text-sm font-bold text-foreground dark:text-foreground-dark">
                      {item.name}
                    </Text>
                    <View className="mt-0.5 flex-row items-center gap-2">
                      <Text className="text-[11px] text-muted dark:text-muted-dark">
                        dia {item.dueDay} ·{' '}
                        {money(paid && item.payment ? item.payment.amount : item.amount)}
                      </Text>
                      <Badge tone={toneOf[item.monthlyStatus]} label={item.monthlyStatus} />
                    </View>
                  </View>
                  <Pressable
                    accessibilityLabel={`Editar ${item.name}`}
                    hitSlop={8}
                    onPress={() => {
                      setEditing({
                        id: item.id,
                        name: item.name,
                        amount: item.amount,
                        dueDay: item.dueDay,
                        categoryId: item.categoryId,
                      })
                      setFormOpen(true)
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color="#9C9B9B" />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Excluir ${item.name}`}
                    hitSlop={8}
                    onPress={() =>
                      confirmDelete(
                        'Excluir gasto fixo',
                        `Excluir "${item.name}"? O histórico de pagamentos deste gasto será removido; as transações já criadas permanecem.`,
                        () => del.mutate({ id: item.id }),
                      )
                    }
                  >
                    <Ionicons name="trash-outline" size={18} color="#9C9B9B" />
                  </Pressable>
                  <Toggle
                    checked={paid}
                    disabled={pay.isPending || unpay.isPending}
                    onChange={(next) =>
                      next
                        ? pay.mutate({ id: item.id, month })
                        : unpay.mutate({ id: item.id, month })
                    }
                  />
                </View>
              )
            })}
          </Card>
        ) : (
          <EmptyState
            title="Nenhum gasto fixo"
            hint="Cadastre aluguel, contas e assinaturas abaixo."
          />
        )}

        <View className="my-4">
          {formOpen ? (
            <FixedExpenseFormCard
              key={editing?.id ?? 'new'}
              editing={editing}
              onClose={closeForm}
            />
          ) : (
            <Button title="+ Novo gasto fixo" onPress={() => setFormOpen(true)} />
          )}
        </View>

        <Text className="mb-8 text-[11px] leading-4 text-muted dark:text-muted-dark">
          Marcar como pago cria a despesa do mês automaticamente; desmarcar remove. Na virada do
          mês tudo volta a pendente e o histórico fica preservado — valores editados valem só do
          mês vigente em diante.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}
