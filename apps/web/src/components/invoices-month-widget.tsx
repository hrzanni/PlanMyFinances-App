'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { deriveInstallments, invoiceMonthSummary } from '@pmf/core'
import { Card, LoadingState } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { money, monthLabel } from '@/lib/format'
import { globalOverdue, toPayments, toSchedule } from './invoice-derive'

const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

/** Widget "Faturas do mês" — resumo + alerta de atraso + próximas parcelas a vencer. */
export function InvoicesMonthWidget({ month }: { month: string }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const list = trpc.invoices.list.useQuery()

  const rows = list.data ?? []

  const { summary, ovd, items } = useMemo(() => {
    const heroRows = rows.map((r) => ({ schedule: toSchedule(r), payments: toPayments(r) }))
    const summary = invoiceMonthSummary(heroRows, month, today)
    const ovd = globalOverdue(heroRows, today)

    const items: Array<{ label: string; dueDate: string; value: number; late: boolean }> = []
    for (const row of rows) {
      const schedule = toSchedule(row)
      for (const st of deriveInstallments(schedule, toPayments(row), today)) {
        if (!st.paid && st.dueDate.slice(0, 7) <= month) {
          items.push({
            label: row.description || row.cardName,
            dueDate: st.dueDate,
            value: schedule.amountPerInstallment,
            late: st.overdue,
          })
        }
      }
    }
    items.sort((a, b) => a.dueDate.localeCompare(b.dueDate))

    return { summary, ovd, items }
  }, [rows, month, today])

  if (list.isLoading) {
    return (
      <Card>
        <LoadingState />
      </Card>
    )
  }

  if (rows.length === 0) return null

  const paidPct = summary.total ? Math.round((summary.paidAmt / summary.total) * 100) : 0

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[2.5px] text-muted">
          Faturas de {monthLabel(month).split(' ')[0]}
        </span>
        <Link href="/faturas" className="text-xs font-bold text-foreground hover:underline">
          ver todas →
        </Link>
      </div>

      {summary.due === 0 ? (
        <div className="text-lg font-black text-positive">✓ Faturas do mês em dia</div>
      ) : (
        <div className="text-2xl font-black tracking-tight text-foreground">
          {money(summary.due)}{' '}
          <span className="text-xs font-normal text-muted">
            a pagar · {summary.nPend} {summary.nPend === 1 ? 'parcela' : 'parcelas'}
          </span>
        </div>
      )}

      <div className="my-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-positive transition-[width] duration-500"
          style={{ width: `${paidPct}%` }}
        />
      </div>
      <div className="text-[11px] tabular-nums text-muted">
        {money(summary.paidAmt)} pagos de {money(summary.total)} no mês
      </div>

      {ovd.count > 0 ? (
        <div className="mt-1.5 text-xs font-bold text-negative">
          ⚠ {ovd.count} {ovd.count === 1 ? 'parcela em atraso' : 'parcelas em atraso'} ·{' '}
          {money(ovd.amt)}
        </div>
      ) : null}

      <div className="mt-2">
        {items.map((item, i) => (
          <div
            key={`${item.label}-${item.dueDate}-${i}`}
            className="flex items-center gap-2 border-t border-line py-1.5 text-xs first:border-0"
          >
            <span className="min-w-0 flex-1 truncate font-bold text-foreground">{item.label}</span>
            <span className={item.late ? 'font-bold text-negative' : 'text-muted'}>
              {item.late ? 'venceu' : 'vence'} {ddmm(item.dueDate)}
            </span>
            <span className={`font-bold tabular-nums ${item.late ? 'text-negative' : 'text-foreground'}`}>
              {money(item.value)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
