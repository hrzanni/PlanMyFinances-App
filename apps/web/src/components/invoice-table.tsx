'use client'

import { Fragment } from 'react'
import { installmentForMonth, type InstallmentState } from '@pmf/core'
import { money, monthLabel } from '@/lib/format'
import { rowInstallments, toSchedule, type InvoiceRow } from '@/components/invoice-derive'
import { Chevron, InstallmentsPanel } from '@/components/installments-panel'

export type { InvoiceRow, InvoiceStatus } from '@/components/invoice-derive'

function MonthBadge({ row, month, today }: { row: InvoiceRow; month: string; today: string }) {
  const n = installmentForMonth(toSchedule(row), month)
  if (!n) return <span className="rounded-full bg-muted/10 px-2.5 py-1 text-[10px] font-bold text-muted">sem parcela</span>
  const st = rowInstallments(row, today)[n - 1] as InstallmentState
  const day = Number(st.dueDate.slice(8))
  if (st.paid)
    return <span className="rounded-full bg-positive/10 px-2.5 py-1 text-[10px] font-bold text-positive">paga ✓</span>
  if (st.overdue)
    return <span className="rounded-full bg-negative/10 px-2.5 py-1 text-[10px] font-bold text-negative">venceu dia {day}</span>
  return <span className="rounded-full bg-attention/10 px-2.5 py-1 text-[10px] font-bold text-attention">vence dia {day}</span>
}

/** Tabela de faturas ativas de um grupo (cartão ou "sem cartão"), com parcelas expansíveis. */
export function InvoiceTable({
  rows,
  month,
  today,
  expandedId,
  onToggle,
  onOpenPayment,
  onDelete,
}: {
  rows: InvoiceRow[]
  month: string
  today: string
  expandedId: string | null
  onToggle: (id: string) => void
  onOpenPayment: (invoiceId: string, n: number) => void
  onDelete: (row: InvoiceRow) => void
}) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr>
          {['Descrição', 'Progresso', 'Parcela', 'Restante', monthLabel(month).split(' ')[0], ''].map((h, i) => (
            <th
              key={i}
              className="border-b border-line px-2 py-1.5 text-left text-[9.5px] font-bold uppercase tracking-wider text-muted"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const per = Number(row.amountPerInstallment)
          const paidCount = row.payments.length
          const pct = Math.round((paidCount / row.totalInstallments) * 100)
          const remaining = (row.totalInstallments - paidCount) * per
          const open = expandedId === row.id
          return (
            <Fragment key={row.id}>
              <tr className="cursor-pointer hover:[&>td]:bg-foreground/[.03]" onClick={() => onToggle(row.id)}>
                <td className="border-b border-line px-2 py-2.5 font-bold text-foreground">
                  {row.description || row.cardName}
                </td>
                <td className="whitespace-nowrap border-b border-line px-2 py-2.5 tabular-nums text-body">
                  {paidCount}/{row.totalInstallments}
                  <span className="ml-2 inline-block h-1 w-14 overflow-hidden rounded-full bg-line align-middle">
                    <span className="block h-full rounded-full bg-positive" style={{ width: `${pct}%` }} />
                  </span>
                </td>
                <td className="border-b border-line px-2 py-2.5 tabular-nums text-body">{money(per)}</td>
                <td className="border-b border-line px-2 py-2.5 tabular-nums text-body">{money(remaining)}</td>
                <td className="border-b border-line px-2 py-2.5">
                  <MonthBadge row={row} month={month} today={today} />
                </td>
                <td className="border-b border-line px-2 py-2.5 text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] font-bold text-foreground transition-colors ${
                      open ? 'bg-foreground/10' : 'bg-foreground/5'
                    }`}
                  >
                    parcelas <Chevron open={open} />
                  </span>
                  <button
                    type="button"
                    aria-label={`Excluir fatura ${row.cardName}`}
                    className="ml-2.5 text-[11px] text-muted underline hover:text-negative"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(row)
                    }}
                  >
                    excluir
                  </button>
                </td>
              </tr>
              {open ? (
                <tr>
                  <td colSpan={6} className="px-2 pb-2.5 pt-1">
                    <InstallmentsPanel
                      installments={rowInstallments(row, today)}
                      onOpenPayment={(n) => onOpenPayment(row.id, n)}
                    />
                  </td>
                </tr>
              ) : null}
            </Fragment>
          )
        })}
      </tbody>
    </table>
  )
}
