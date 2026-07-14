import {
  deriveInstallments,
  type InstallmentPayment,
  type InstallmentState,
  type InvoiceSchedule,
} from '@pmf/core'
import type { RouterOutputs } from '@/lib/trpc'

export type InvoiceRow = RouterOutputs['invoices']['list'][number]

/** Cronograma da fatura a partir da linha da API (numeric/date chegam como string). */
export function toSchedule(row: InvoiceRow): InvoiceSchedule {
  return {
    amountPerInstallment: Number(row.amountPerInstallment),
    totalInstallments: row.totalInstallments,
    firstDueDate: String(row.firstDueDate).slice(0, 10),
  }
}

/** Pagamentos da fatura convertidos para o formato do core. */
export function toPayments(row: InvoiceRow): InstallmentPayment[] {
  return row.payments.map((p) => ({
    id: p.id,
    installmentNumber: p.installmentNumber,
    amount: Number(p.amount),
    paidOn: String(p.paidOn).slice(0, 10),
  }))
}

/** Estados das parcelas de uma fatura na data de referência. */
export function rowInstallments(row: InvoiceRow, today: string): InstallmentState[] {
  return deriveInstallments(toSchedule(row), toPayments(row), today)
}

/** Total de parcelas não pagas e vencidas (em qualquer mês) do conjunto informado. */
export function globalOverdue(
  rows: Array<{ schedule: InvoiceSchedule; payments: InstallmentPayment[] }>,
  today: string,
): { amt: number; count: number } {
  let cents = 0
  let count = 0
  for (const { schedule, payments } of rows) {
    for (const st of deriveInstallments(schedule, payments, today)) {
      if (st.overdue) {
        cents += Math.round(schedule.amountPerInstallment * 100)
        count++
      }
    }
  }
  return { amt: cents / 100, count }
}
