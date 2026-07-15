'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import type { FixedExpenseTotals } from '@pmf/core'
import { fixedBalance, fixedDueBadge, fixedDueInfo, nextPendingFixed } from '@pmf/core'
import { Badge, Card, EmptyState, LoadingState } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { money, monthLabel } from '@/lib/format'
import { DayDot } from './timeline-bits'

/** Widget da Início: mini agenda das próximas pendências + progresso do mês. */
export function FixedMonthWidget({ month }: { month: string }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const list = trpc.fixedExpenses.list.useQuery({ month })
  const categories = trpc.categories.list.useQuery()

  const items = list.data?.items ?? []
  const totals = list.data?.totals
  const categoryNames = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  )

  if (list.isLoading) {
    return (
      <Card>
        <LoadingState />
      </Card>
    )
  }

  const balance = totals ? fixedBalance(totals) : 0
  const upcoming = nextPendingFixed(items, 3)
  const monthAbbr = monthLabel(month).slice(0, 3).toLowerCase()

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[2.5px] text-muted">
          Fixos do mês
        </span>
        {items.length > 0 ? (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-black tabular-nums ${
              balance < 0 ? 'bg-negative/10 text-negative' : 'bg-positive/10 text-positive'
            }`}
          >
            {balance < 0 ? '−' : '+'}
            {money(Math.abs(balance))}
          </span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhum fixo cadastrado"
          hint="Cadastre aluguel, contas, assinaturas e salário."
        />
      ) : (
        <>
          {upcoming.length === 0 ? (
            <div className="py-1 text-lg font-black text-positive">✓ Tudo em dia</div>
          ) : (
            upcoming.map((item) => {
              const badge = fixedDueBadge(
                {
                  type: item.type,
                  dueDay: item.dueDay,
                  monthlyStatus: item.monthlyStatus,
                  paidAt: item.payment?.paidAt ?? null,
                },
                month,
                today,
              )
              const isToday = fixedDueInfo(item.dueDay, month, today).kind === 'today'
              return (
                <div key={item.id} className="flex items-center gap-2.5 py-1.5">
                  <DayDot day={item.dueDay} monthAbbr={monthAbbr} today={isToday} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-foreground">{item.name}</div>
                    <div className="truncate text-xs text-muted">
                      {(item.categoryId && categoryNames.get(item.categoryId)) || 'Sem categoria'}
                    </div>
                  </div>
                  <span
                    className={`text-sm font-black tabular-nums ${
                      item.type === 'receita' ? 'text-positive' : 'text-negative'
                    }`}
                  >
                    {item.type === 'receita' ? '+' : ''}
                    {money(item.amount)}
                  </span>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </div>
              )
            })
          )}

          <div className="my-2 border-t border-line" />
          {totals ? (
            <>
              <ProgressRow kind="despesa" items={items} totals={totals} />
              <ProgressRow kind="receita" items={items} totals={totals} />
            </>
          ) : null}

          <div className="mt-1 text-right">
            <Link href="/gastos-fixos" className="text-xs font-bold text-info hover:underline">
              Ver todos →
            </Link>
          </div>
        </>
      )}
    </Card>
  )
}

function ProgressRow({
  kind,
  items,
  totals,
}: {
  kind: 'despesa' | 'receita'
  items: Array<{ type: string; monthlyStatus: string; amount: string }>
  totals: { expense: FixedExpenseTotals; income: FixedExpenseTotals }
}) {
  const t = kind === 'despesa' ? totals.expense : totals.income
  const ofType = items.filter((i) => i.type === kind)
  const paidCount = ofType.filter((i) => i.monthlyStatus === 'pago').length
  const lateAmount = ofType
    .filter((i) => i.monthlyStatus === 'vencido')
    .reduce((acc, i) => acc + Number(i.amount), 0)
  const paidPct = t.total ? Math.round((t.paid / t.total) * 100) : 0
  const latePct = t.total ? Math.round((lateAmount / t.total) * 100) : 0
  const noun = kind === 'despesa' ? 'pagas' : 'recebidas'
  const pendingLabel = kind === 'despesa' ? 'pend.' : 'a receber'
  return (
    <div className="mb-2">
      <div className="flex items-baseline gap-1.5 text-xs">
        <span className="font-black text-foreground">
          {kind === 'despesa' ? 'Despesas' : 'Receitas'}
        </span>
        <span className="text-muted">
          {paidCount} de {ofType.length} {noun}
        </span>
        <span className="ml-auto tabular-nums text-muted">
          {money(t.pending)} {pendingLabel}
        </span>
      </div>
      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-positive" style={{ width: `${paidPct}%` }} />
        {latePct > 0 ? <div className="h-full bg-negative" style={{ width: `${latePct}%` }} /> : null}
      </div>
    </div>
  )
}
