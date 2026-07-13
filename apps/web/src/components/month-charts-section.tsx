'use client'

import { useState } from 'react'
import { Card, CardTitle, EmptyState, Kpi, LoadingState } from '@pmf/ui-web'
import { useMonthSummary } from '@/hooks/use-month-summary'
import { currentMonth, money, monthLabel } from '@/lib/format'
import { MonthSelector } from '@/components/month-selector'
import { IncomeExpenseChart } from '@/components/income-expense-chart'
import { BalanceLineChart } from '@/components/balance-line-chart'

/** Seção de gráficos por mês da Início (antigo Dashboard, FR-003). Mês selecionável, independente do topo. */
export function MonthChartsSection() {
  const [month, setMonth] = useState(currentMonth)
  const summary = useMonthSummary(month)

  const daily = summary.data?.daily ?? []
  const hasData = (summary.data?.incomeCount ?? 0) + (summary.data?.expenseCount ?? 0) > 0

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Gráficos por mês</h2>
        <MonthSelector month={month} onChange={setMonth} />
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Kpi label="Receitas" value={money(summary.data?.income ?? 0)} tone="positive" />
        <Kpi label="Despesas" value={money(summary.data?.expense ?? 0)} tone="negative" />
        <Kpi label="Saldo" value={money(summary.data?.balance ?? 0)} />
      </div>

      {summary.isLoading ? (
        <LoadingState />
      ) : hasData ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardTitle>Saldo acumulado por dia</CardTitle>
            <BalanceLineChart daily={daily} />
          </Card>

          <Card>
            <CardTitle>Receitas × Despesas — {monthLabel(month)}</CardTitle>
            <IncomeExpenseChart
              income={summary.data?.income ?? 0}
              expense={summary.data?.expense ?? 0}
            />
            <div className="mt-2 flex gap-4 text-xs text-muted">
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-sm bg-positive" />
                Receitas
              </span>
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-sm bg-negative" />
                Despesas
              </span>
            </div>
          </Card>
        </div>
      ) : (
        <EmptyState
          title={`Sem transações em ${monthLabel(month)}`}
          hint="Os gráficos aparecem quando houver lançamentos no mês."
        />
      )}
    </section>
  )
}
