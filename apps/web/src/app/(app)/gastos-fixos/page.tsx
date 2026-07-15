'use client'

import { useMemo, useState } from 'react'
import { fixedPendingSummary } from '@pmf/core'
import { Button, EmptyState, ErrorState, LoadingState } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { currentMonth, monthLabel } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { MonthSelector } from '@/components/month-selector'
import { FixedExpenseForm, type EditableFixedExpense } from '@/components/fixed-expense-form'
import { FixedKpis } from '@/components/fixed/fixed-kpis'
import { TypeFilterPills, type FixedTypeFilter } from '@/components/fixed/type-filter-pills'
import { FixedTimeline, type FixedTimelineItemData } from '@/components/fixed/fixed-timeline'

export default function FixedExpensesPage() {
  const [month, setMonth] = useState(currentMonth)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EditableFixedExpense | null>(null)
  const [typeFilter, setTypeFilter] = useState<FixedTypeFilter>('todos')
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const utils = trpc.useUtils()
  const list = trpc.fixedExpenses.list.useQuery({ month })
  const categories = trpc.categories.list.useQuery()
  const invalidate = () => {
    utils.fixedExpenses.invalidate()
    utils.transactions.invalidate()
    utils.dashboard.invalidate()
  }
  const pay = trpc.fixedExpenses.pay.useMutation({ onSuccess: invalidate })
  const unpay = trpc.fixedExpenses.unpay.useMutation({ onSuccess: invalidate })
  const del = trpc.fixedExpenses.delete.useMutation({ onSuccess: invalidate })

  const items = list.data?.items ?? []
  const counts = {
    todos: items.length,
    despesa: items.filter((i) => i.type === 'despesa').length,
    receita: items.filter((i) => i.type === 'receita').length,
  }
  const filteredItems = items.filter((i) => typeFilter === 'todos' || i.type === typeFilter)
  const pending = fixedPendingSummary(items)
  const categoryNames = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  )
  const monthAbbr = monthLabel(month).slice(0, 3).toLowerCase()

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

      <FixedKpis totals={list.data?.totals} pending={pending} />
      <TypeFilterPills value={typeFilter} onChange={setTypeFilter} counts={counts} />

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
        <FixedTimeline
          items={filteredItems as FixedTimelineItemData[]}
          month={month}
          today={today}
          monthAbbr={monthAbbr}
          categoryNames={categoryNames}
          mutating={pay.isPending || unpay.isPending}
          onToggle={(item, next) =>
            next ? pay.mutate({ id: item.id, month }) : unpay.mutate({ id: item.id, month })
          }
          onEdit={(item) => {
            setEditing(item as EditableFixedExpense)
            setFormOpen(true)
          }}
          onDelete={(item) => {
            if (
              window.confirm(
                `Excluir "${item.name}"? O histórico de pagamentos deste item será removido; as transações já criadas permanecem.`,
              )
            ) {
              del.mutate({ id: item.id })
            }
          }}
        />
      )}

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
