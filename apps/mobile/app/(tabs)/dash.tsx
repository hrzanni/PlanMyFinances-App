import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { trpc } from '@/lib/trpc'
import { addMonths, currentMonth, money, monthLabel } from '@/lib/format'
import { Card, EmptyState, Kpi, ScreenTitle } from '@/components/ui'
import { BalanceLineChart, BarsChart } from '@/components/charts'

export default function DashboardScreen() {
  const [month, setMonth] = useState(currentMonth)
  const summary = trpc.dashboard.month.useQuery({ month })
  const hasData = (summary.data?.incomeCount ?? 0) + (summary.data?.expenseCount ?? 0) > 0

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-3">
        <ScreenTitle>Dashboard</ScreenTitle>

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

        <View className="mb-2 flex-row gap-2">
          <Kpi label="Receitas" value={money(summary.data?.income ?? 0)} tone="positive" />
          <Kpi label="Despesas" value={money(summary.data?.expense ?? 0)} tone="negative" />
        </View>
        <View className="mb-4">
          <Kpi label="Saldo" value={money(summary.data?.balance ?? 0)} />
        </View>

        {hasData ? (
          <>
            <Card className="mb-4">
              <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">
                Saldo acumulado por dia
              </Text>
              <BalanceLineChart daily={summary.data?.daily ?? []} />
            </Card>
            <Card className="mb-8">
              <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">
                Receitas × Despesas
              </Text>
              <BarsChart income={summary.data?.income ?? 0} expense={summary.data?.expense ?? 0} />
            </Card>
          </>
        ) : (
          <EmptyState
            title={`Sem transações em ${monthLabel(month)}`}
            hint="Os gráficos aparecem quando houver lançamentos."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
