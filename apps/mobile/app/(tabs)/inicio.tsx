import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { firstName } from '@pmf/core'
import { trpc } from '@/lib/trpc'
import { currentMonth, money } from '@/lib/format'
import { useMonthSummary } from '@/hooks/use-month-summary'
import { Button, Card, EmptyState, Kpi, ScreenTitle } from '@/components/ui'
import { TxRow } from '@/components/tx-row'
import { TxFormModal } from '@/components/tx-form-modal'
import { MonthSelector } from '@/components/month-selector'
import { MonthChartsSection } from '@/components/month-charts-section'
import { InvoicesMonthWidget } from '@/components/invoices-month-widget'
import { FixedMonthWidget } from '@/components/fixed-month-widget'

export default function HomeScreen() {
  const [month, setMonth] = useState(currentMonth)
  const [formOpen, setFormOpen] = useState(false)
  const summary = useMonthSummary(month)
  const recent = trpc.transactions.list.useQuery({ limit: 5 })
  const me = trpc.users.me.useQuery()
  const greeting = me.data ? `Bem-vindo, ${firstName(me.data.name)}` : 'Bem-vindo'

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-3">
        <View className="mb-2">
          <ScreenTitle>{greeting}</ScreenTitle>
        </View>

        <MonthSelector month={month} onChange={setMonth} />

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

        <FixedMonthWidget month={month} />

        <InvoicesMonthWidget />

        <MonthChartsSection month={month} />
      </ScrollView>
      <TxFormModal open={formOpen} editing={null} onClose={() => setFormOpen(false)} />
    </SafeAreaView>
  )
}
