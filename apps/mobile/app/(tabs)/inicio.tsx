import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { firstName } from '@pmf/core'
import { trpc } from '@/lib/trpc'
import { currentMonth, money, monthLabel } from '@/lib/format'
import { useMonthSummary } from '@/hooks/use-month-summary'
import { Button, Card, EmptyState, Kpi, ScreenTitle } from '@/components/ui'
import { TxRow } from '@/components/tx-row'
import { TxFormModal } from '@/components/tx-form-modal'
import { MonthChartsSection } from '@/components/month-charts-section'

export default function HomeScreen() {
  const month = currentMonth()
  const [formOpen, setFormOpen] = useState(false)
  const summary = useMonthSummary(month)
  const recent = trpc.transactions.list.useQuery({ limit: 5 })
  const fixed = trpc.fixedExpenses.list.useQuery({ month })
  const me = trpc.users.me.useQuery()
  const greeting = me.data ? `Bem-vindo, ${firstName(me.data.name)}` : 'Bem-vindo'

  const paidCount = fixed.data?.items.filter((i) => i.monthlyStatus === 'pago').length ?? 0

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-3">
        <View className="mb-2 flex-row items-center justify-between">
          <ScreenTitle>{greeting}</ScreenTitle>
          <Text className="text-xs font-bold text-muted dark:text-muted-dark">
            {monthLabel(month)}
          </Text>
        </View>

        <View className="mb-3 flex-row gap-2">
          <Kpi label="Receitas" value={money(summary.data?.income ?? 0)} tone="positive" />
          <Kpi label="Despesas" value={money(summary.data?.expense ?? 0)} tone="negative" />
        </View>
        <View className="mb-4">
          <Kpi label="Saldo do mês" value={money(summary.data?.balance ?? 0)} />
        </View>

        <Button title="+ Nova transação" onPress={() => setFormOpen(true)} />

        <Card className="mt-4">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">
            Últimas transações
          </Text>
          {recent.data && recent.data.items.length > 0 ? (
            recent.data.items.map((tx) => <TxRow key={tx.id} tx={tx} />)
          ) : (
            <EmptyState title="Nenhuma transação ainda" />
          )}
        </Card>

        <Card className="mb-8 mt-4">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">
            Gastos fixos do mês
          </Text>
          {fixed.data && fixed.data.items.length > 0 ? (
            <>
              <Text className="text-sm text-body dark:text-body-dark">
                <Text className="font-bold text-foreground dark:text-foreground-dark">
                  {paidCount} de {fixed.data.items.length} pagos
                </Text>{' '}
                · {money(fixed.data.totals.pending)} pendentes
              </Text>
              <Link
                href="/(tabs)/fixos"
                className="mt-2 text-xs font-bold text-info dark:text-info-dark"
              >
                Ver todos →
              </Link>
            </>
          ) : (
            <EmptyState title="Nenhum gasto fixo" hint="Cadastre na aba Fixos." />
          )}
        </Card>

        <MonthChartsSection />
      </ScrollView>
      <TxFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </SafeAreaView>
  )
}
