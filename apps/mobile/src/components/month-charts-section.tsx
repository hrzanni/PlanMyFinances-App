import { Text, View } from 'react-native'
import { useMonthSummary } from '@/hooks/use-month-summary'
import { monthLabel } from '@/lib/format'
import { Card, EmptyState } from '@/components/ui'
import { BalanceLineChart, BarsChart } from '@/components/charts'

/** Gráficos do mês da Início (FR-003). Segue o mês do seletor do topo. */
export function MonthChartsSection({ month }: { month: string }) {
  const summary = useMonthSummary(month)
  const hasData = (summary.data?.incomeCount ?? 0) + (summary.data?.expenseCount ?? 0) > 0

  return (
    <View className="mt-2">
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
