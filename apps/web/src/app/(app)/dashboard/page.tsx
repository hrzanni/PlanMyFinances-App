'use client'

import { useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { formatCurrency, formatDate } from '@pmf/core'
import { Card, CardTitle, EmptyState, Kpi, LoadingState } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { currentMonth, money, monthLabel } from '@/lib/format'
import { useChartColors } from '@/lib/chart-colors'
import { PageHeader } from '@/components/page-header'
import { MonthSelector } from '@/components/month-selector'
import { IncomeExpenseChart } from '@/components/income-expense-chart'

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth)
  const colors = useChartColors()
  const summary = trpc.dashboard.month.useQuery({ month })

  const daily = summary.data?.daily ?? []
  const hasData = (summary.data?.incomeCount ?? 0) + (summary.data?.expenseCount ?? 0) > 0

  return (
    <>
      <PageHeader title="Dashboard">
        <MonthSelector month={month} onChange={setMonth} />
      </PageHeader>

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
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={colors.line} strokeDasharray="3 4" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => d.slice(8)}
                    tick={{ fontSize: 11, fill: colors.muted }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                    tick={{ fontSize: 11, fill: colors.muted }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    formatter={(v: number | string) => formatCurrency(Number(v))}
                    labelFormatter={(d) => formatDate(String(d))}
                    contentStyle={{
                      background: colors.surface,
                      border: `1px solid ${colors.line}`,
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Saldo"
                    stroke={colors.navy}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
    </>
  )
}
