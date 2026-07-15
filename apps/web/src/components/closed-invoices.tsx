'use client'

import { useState } from 'react'
import { installmentDueDate } from '@pmf/core'
import { Card } from '@pmf/ui-web'
import { money } from '@/lib/format'
import { Chevron } from '@/components/installments-panel'
import { toSchedule, type InvoiceRow } from '@/components/invoice-derive'

const endLabel = (row: InvoiceRow) => {
  const iso = installmentDueDate(toSchedule(row).firstDueDate, row.totalInstallments)
  const d = new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, 15))
  const m = d.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '')
  return `${m}/${iso.slice(2, 4)}`
}

/** Seção recolhida das faturas totalmente pagas. */
export function ClosedInvoices({ rows, showCard }: { rows: InvoiceRow[]; showCard: boolean }) {
  const [open, setOpen] = useState(false)
  if (rows.length === 0) return null

  return (
    <Card className="opacity-90">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[2px] text-muted"
      >
        Faturas encerradas
        <span className="rounded-full bg-muted/10 px-2.5 py-0.5 text-[10px] tracking-normal">
          {rows.length}
        </span>
        <Chevron open={open} />
      </button>
      {open ? (
        <table className="mt-3 w-full border-collapse text-xs">
          <thead>
            <tr>
              {['Descrição', ...(showCard ? ['Cartão'] : []), 'Parcelas', 'Total pago', 'Status'].map(
                (h, i) => (
                  <th
                    key={i}
                    className="border-b border-line px-2 py-1.5 text-left text-[9.5px] font-bold uppercase tracking-wider text-muted"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="border-b border-line px-2 py-2.5 font-bold text-body">
                  {row.description || row.cardName}
                </td>
                {showCard ? (
                  <td className="border-b border-line px-2 py-2.5 text-body">{row.cardName}</td>
                ) : null}
                <td className="border-b border-line px-2 py-2.5 tabular-nums text-body">
                  {row.totalInstallments}/{row.totalInstallments}
                </td>
                <td className="border-b border-line px-2 py-2.5 tabular-nums text-body">
                  {money(Number(row.amountPerInstallment) * row.totalInstallments)}
                </td>
                <td className="border-b border-line px-2 py-2.5">
                  <span className="rounded-full bg-positive/10 px-2.5 py-1 text-[10px] font-bold text-positive">
                    encerrada em {endLabel(row)} ✓
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </Card>
  )
}
