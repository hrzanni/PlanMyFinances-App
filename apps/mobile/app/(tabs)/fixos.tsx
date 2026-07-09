import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { trpc } from '@/lib/trpc'
import { addMonths, currentMonth, money, monthLabel } from '@/lib/format'
import { Badge, Button, Card, EmptyState, Input, Kpi, ScreenTitle, Toggle } from '@/components/ui'

const toneOf = { pago: 'paid', pendente: 'pending', vencido: 'late' } as const

export default function FixedExpensesScreen() {
  const [month, setMonth] = useState(currentMonth)
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDay, setDueDay] = useState('5')
  const [error, setError] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const list = trpc.fixedExpenses.list.useQuery({ month })
  const invalidate = () => {
    utils.fixedExpenses.invalidate()
    utils.transactions.invalidate()
    utils.dashboard.invalidate()
  }
  const pay = trpc.fixedExpenses.pay.useMutation({ onSuccess: invalidate })
  const unpay = trpc.fixedExpenses.unpay.useMutation({ onSuccess: invalidate })
  const create = trpc.fixedExpenses.create.useMutation({
    onSuccess: () => {
      invalidate()
      setFormOpen(false)
      setName('')
      setAmount('')
    },
    onError: () => setError('Erro ao salvar'),
  })

  function submit() {
    setError(null)
    const parsed = Number(amount.replace(',', '.'))
    const day = Number(dueDay)
    if (!name.trim()) return setError('Informe o nome')
    if (!parsed || parsed <= 0) return setError('Valor maior que zero')
    if (!day || day < 1 || day > 31) return setError('Dia entre 1 e 31')
    create.mutate({ name: name.trim(), amount: parsed, dueDay: day })
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
            <Card>
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
              {error ? (
                <Text className="mb-2 text-xs font-bold text-negative dark:text-negative-dark">
                  {error}
                </Text>
              ) : null}
              <Button
                title={create.isPending ? 'Salvando…' : 'Salvar'}
                onPress={submit}
                disabled={create.isPending}
              />
              <View className="h-2" />
              <Button title="Cancelar" variant="ghost" onPress={() => setFormOpen(false)} />
            </Card>
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
