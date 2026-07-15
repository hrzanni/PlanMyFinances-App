'use client'

import { useState } from 'react'
import { formatDate } from '@pmf/core'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Kpi,
  LoadingState,
  Select,
  Table,
  Td,
  Th,
  Toggle,
} from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { currentMonth, money } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { MonthSelector } from '@/components/month-selector'
import { FixedExpenseForm, type EditableFixedExpense } from '@/components/fixed-expense-form'

const statusTone = { pago: 'paid', pendente: 'pending', vencido: 'late' } as const

type TypeFilter = 'todos' | 'despesa' | 'receita'

export default function FixedExpensesPage() {
  const [month, setMonth] = useState(currentMonth)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EditableFixedExpense | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos')

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

  const totals = list.data?.totals
  const items = list.data?.items ?? []
  const expenseCount = items.filter((i) => i.type === 'despesa').length
  const incomeCount = items.filter((i) => i.type === 'receita').length
  const filteredItems = items.filter((i) => typeFilter === 'todos' || i.type === typeFilter)

  function statusLabel(item: NonNullable<typeof list.data>['items'][number]): string {
    const verb = item.type === 'receita' ? 'recebido' : 'pago'
    if (item.monthlyStatus === 'pago' && item.payment) {
      return `${verb} em ${formatDate(item.payment.paidAt)}`
    }
    return item.monthlyStatus
  }

  return (
    <>
      <PageHeader
        title="Fixos"
        subtitle="Despesas e receitas recorrentes com vencimento e controle mensal. Marcar como pago/recebido registra a transação do mês automaticamente."
      >
        <MonthSelector month={month} onChange={setMonth} />
        <Button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          + Novo fixo
        </Button>
      </PageHeader>

      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
        Despesas fixas
      </div>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Kpi
          label="Total mensal"
          value={money(totals?.expense.total ?? 0)}
          detail={`${expenseCount} ativas`}
        />
        <Kpi label="Pago no mês" value={money(totals?.expense.paid ?? 0)} tone="positive" />
        <Kpi label="Pendente" value={money(totals?.expense.pending ?? 0)} tone="negative" />
      </div>

      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
        Receitas fixas
      </div>
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Kpi
          label="Total mensal"
          value={money(totals?.income.total ?? 0)}
          detail={`${incomeCount} ativas`}
        />
        <Kpi label="Recebido no mês" value={money(totals?.income.paid ?? 0)} tone="positive" />
        <Kpi label="Pendente" value={money(totals?.income.pending ?? 0)} tone="negative" />
      </div>

      <div className="mb-3 w-48">
        <Select
          aria-label="Filtrar por tipo"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
        >
          <option value="todos">Todos</option>
          <option value="despesa">Despesas</option>
          <option value="receita">Receitas</option>
        </Select>
      </div>

      <Card>
        {list.isLoading ? (
          <LoadingState />
        ) : list.isError ? (
          <ErrorState onRetry={() => list.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhum fixo cadastrado"
            hint="Aluguel, condomínio, IPTU, streaming, salário — cadastre e controle mês a mês."
          />
        ) : filteredItems.length === 0 ? (
          <EmptyState title="Nenhum item para esse filtro" hint="Troque o filtro acima ou cadastre um novo fixo." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Tipo</Th>
                <Th numeric>Valor</Th>
                <Th>Vencimento</Th>
                <Th>Status no mês</Th>
                <Th>Pago</Th>
                <Th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const paid = item.monthlyStatus === 'pago'
                return (
                  <tr key={item.id}>
                    <Td className="font-bold text-foreground">{item.name}</Td>
                    <Td>
                      <span
                        className={`text-xs font-bold ${
                          item.type === 'receita' ? 'text-positive' : 'text-negative'
                        }`}
                      >
                        {item.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </Td>
                    <Td numeric>{money(paid && item.payment ? item.payment.amount : item.amount)}</Td>
                    <Td>dia {item.dueDay}</Td>
                    <Td>
                      <Badge tone={statusTone[item.monthlyStatus]}>{statusLabel(item)}</Badge>
                    </Td>
                    <Td>
                      <Toggle
                        checked={paid}
                        disabled={pay.isPending || unpay.isPending}
                        aria-label={`Marcar ${item.name} como ${
                          paid ? 'pendente' : item.type === 'receita' ? 'recebido' : 'pago'
                        }`}
                        onCheckedChange={(next) =>
                          next
                            ? pay.mutate({ id: item.id, month })
                            : unpay.mutate({ id: item.id, month })
                        }
                      />
                    </Td>
                    <Td numeric>
                      <span className="inline-flex gap-2">
                        <button
                          type="button"
                          aria-label={`Editar ${item.name}`}
                          className="text-muted hover:text-foreground"
                          onClick={() => {
                            setEditing(item)
                            setFormOpen(true)
                          }}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          aria-label={`Excluir ${item.name}`}
                          className="text-muted hover:text-negative"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Excluir "${item.name}"? O histórico de pagamentos deste item será removido; as transações já criadas permanecem.`,
                              )
                            ) {
                              del.mutate({ id: item.id })
                            }
                          }}
                        >
                          🗑
                        </button>
                      </span>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <div className="mt-4 rounded-r-lg border-l-4 border-info bg-info/5 px-4 py-3 text-xs text-body">
        <b className="text-foreground">Como funciona a virada do mês:</b> no mês novo tudo volta a
        pendente automaticamente; o histórico fica guardado e você navega para trás no seletor
        acima. Mudou o valor? Vale só do mês vigente em diante — meses pagos guardam o valor da
        época.
      </div>

      <FixedExpenseForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </>
  )
}
