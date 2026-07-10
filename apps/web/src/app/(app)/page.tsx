'use client'

import { useState } from 'react'
import Link from 'next/link'
import { firstName, formatDate } from '@pmf/core'
import { Badge, Button, Card, CardTitle, EmptyState, Kpi, LoadingState } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { currentMonth, money, monthLabel } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { TransactionForm } from '@/components/transaction-form'
import { SourceBadge } from '@/components/tx-badges'
import { IncomeExpenseChart } from '@/components/income-expense-chart'

export default function HomePage() {
  const month = currentMonth()
  const [formOpen, setFormOpen] = useState(false)

  const summary = trpc.dashboard.month.useQuery({ month })
  const recent = trpc.transactions.list.useQuery({ limit: 5 })
  const fixed = trpc.fixedExpenses.list.useQuery({ month })
  const me = trpc.users.me.useQuery()
  const greeting = me.data ? `Bem-vindo, ${firstName(me.data.name)}` : 'Bem-vindo'

  const paidCount = fixed.data?.items.filter((i) => i.monthlyStatus === 'pago').length ?? 0
  const nextPending = fixed.data?.items.find((i) => i.monthlyStatus !== 'pago')

  return (
    <>
      <PageHeader title={greeting}>
        <span className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-bold text-foreground">
          {monthLabel(month)}
        </span>
        <Button onClick={() => setFormOpen(true)}>+ Nova transação</Button>
      </PageHeader>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Kpi
          label="Receitas do mês"
          value={money(summary.data?.income ?? 0)}
          detail={`${summary.data?.incomeCount ?? 0} lançamentos`}
          tone="positive"
        />
        <Kpi
          label="Despesas do mês"
          value={money(summary.data?.expense ?? 0)}
          detail={`${summary.data?.expenseCount ?? 0} lançamentos`}
          tone="negative"
        />
        <Kpi label="Saldo do mês" value={money(summary.data?.balance ?? 0)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardTitle>Últimas transações</CardTitle>
          {recent.isLoading ? (
            <LoadingState />
          ) : recent.data && recent.data.items.length > 0 ? (
            <ul>
              {recent.data.items.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center gap-3 border-b border-line py-2.5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-foreground">
                      {tx.description || (tx.type === 'receita' ? 'Receita' : 'Despesa')}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                      {formatDate(tx.date)}
                      <SourceBadge tx={tx} />
                    </div>
                  </div>
                  <div
                    className={`text-sm font-bold tabular-nums ${
                      tx.type === 'receita' ? 'text-positive' : 'text-negative'
                    }`}
                  >
                    {tx.type === 'receita' ? '+ ' : '− '}
                    {money(tx.value)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nenhuma transação ainda"
              hint="Crie a primeira com o botão acima."
            />
          )}
        </Card>

        <div className="space-y-4">
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

          <Card>
            <CardTitle>Gastos fixos do mês</CardTitle>
            {fixed.data && fixed.data.items.length > 0 ? (
              <>
                <div className="text-sm text-body">
                  <b className="text-foreground">
                    {paidCount} de {fixed.data.items.length} pagos
                  </b>{' '}
                  · {money(fixed.data.totals.pending)} pendentes
                </div>
                {nextPending ? (
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                    Próximo: {nextPending.name} — dia {nextPending.dueDay}
                    <Badge tone={nextPending.monthlyStatus === 'vencido' ? 'late' : 'pending'}>
                      {nextPending.monthlyStatus}
                    </Badge>
                  </div>
                ) : null}
                <Link
                  href="/gastos-fixos"
                  className="mt-2 inline-block text-xs font-bold text-info hover:underline"
                >
                  Ver todos →
                </Link>
              </>
            ) : (
              <EmptyState title="Nenhum gasto fixo" hint="Cadastre aluguel, contas e assinaturas." />
            )}
          </Card>
        </div>
      </div>

      <TransactionForm open={formOpen} onOpenChange={setFormOpen} />
    </>
  )
}
