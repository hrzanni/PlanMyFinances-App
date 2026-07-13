import { useState } from 'react'
import { Text, View } from 'react-native'
import { useMonthSummary } from '@/hooks/use-month-summary'
import { currentMonth, money, monthLabel } from '@/lib/format'
import { Card, EmptyState, Kpi } from '@/components/ui'
import { MonthSelector } from '@/components/month-selector'
import { BalanceLineChart, BarsChart } from '@/components/charts'

/** Seção de gráficos por mês da Início (antiga tab Dash, FR-003). Mês selecionável, independente do topo. */
export function MonthChartsSection() {
  const [month, setMonth] = useState(currentMonth)
  const summary = useMonthSummary(month)
  const hasData = (summary.data?.incomeCount ?? 0) + (summary.data?.expenseCount ?? 0) > 0

  return (
    <View className="mt-6">
      <Text className="mb-2 text-base font-bold text-foreground dark:text-foreground-dark">
        Gráficos por mês
      </Text>

      <MonthSelector month={month} onChange={setMonth} />

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
    </View>
  )
}
