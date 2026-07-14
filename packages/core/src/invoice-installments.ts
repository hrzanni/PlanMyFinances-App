/** Cronograma e estados de parcela de fatura (Faturas v2). Datas ISO 'YYYY-MM-DD'. */

export interface InvoiceSchedule {
  amountPerInstallment: number
  totalInstallments: number
  firstDueDate: string // 'YYYY-MM-DD'
}

export interface InstallmentPayment {
  id: string
  installmentNumber: number
  amount: number
  paidOn: string // 'YYYY-MM-DD'
}

export interface InstallmentState {
  number: number
  dueDate: string
  paid: boolean
  overdue: boolean          // !paid && dueDate < today
  amountPaid: number | null // valor do pagamento, se pago
  paymentId: string | null
}

export interface InvoiceMonthSummary {
  due: number      // soma das parcelas NÃO pagas que vencem no mês
  paidAmt: number  // soma paga das parcelas do mês
  overdue: number  // soma das parcelas do mês em atraso
  nPend: number
  nPaid: number
  total: number    // due + paidAmt
}

const cents = (v: number) => Math.round(v * 100)

/** Vencimento da parcela n (1-based): firstDueDate + (n-1) meses, com clamp de fim de mês. */
export function installmentDueDate(firstDueDate: string, n: number): string {
  const [y, m, d] = firstDueDate.split('-').map(Number)
  const monthIndex = m! - 1 + (n - 1)
  const year = y! + Math.floor(monthIndex / 12)
  const month = monthIndex % 12
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const day = Math.min(d!, lastDay)
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function installmentForMonth(schedule: InvoiceSchedule, month: string): number | null {
  for (let n = 1; n <= schedule.totalInstallments; n++) {
    const due = installmentDueDate(schedule.firstDueDate, n).slice(0, 7)
    if (due === month) return n
    if (due > month) return null
  }
  return null
}

export function deriveInstallments(
  schedule: InvoiceSchedule,
  payments: InstallmentPayment[],
  today: string,
): InstallmentState[] {
  const byNumber = new Map(payments.map((p) => [p.installmentNumber, p]))
  return Array.from({ length: schedule.totalInstallments }, (_, i) => {
    const number = i + 1
    const dueDate = installmentDueDate(schedule.firstDueDate, number)
    const payment = byNumber.get(number)
    return {
      number,
      dueDate,
      paid: !!payment,
      overdue: !payment && dueDate < today,
      amountPaid: payment ? payment.amount : null,
      paymentId: payment ? payment.id : null,
    }
  })
}

export function invoiceMonthSummary(
  rows: Array<{ schedule: InvoiceSchedule; payments: InstallmentPayment[] }>,
  month: string,
  today: string,
): InvoiceMonthSummary {
  let due = 0, paidAmt = 0, overdue = 0, nPend = 0, nPaid = 0
  for (const { schedule, payments } of rows) {
    const n = installmentForMonth(schedule, month)
    if (!n) continue
    const st = deriveInstallments(schedule, payments, today)[n - 1]!
    if (st.paid) { paidAmt += cents(st.amountPaid!); nPaid++ }
    else {
      due += cents(schedule.amountPerInstallment); nPend++
      if (st.overdue) overdue += cents(schedule.amountPerInstallment)
    }
  }
  return { due: due / 100, paidAmt: paidAmt / 100, overdue: overdue / 100, nPend, nPaid, total: (due + paidAmt) / 100 }
}

export function isInvoiceClosed(schedule: InvoiceSchedule, payments: InstallmentPayment[]): boolean {
  const nums = new Set(payments.map((p) => p.installmentNumber))
  for (let n = 1; n <= schedule.totalInstallments; n++) if (!nums.has(n)) return false
  return true
}
