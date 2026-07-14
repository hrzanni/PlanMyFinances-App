export interface InstallmentTotals {
  total: number
  remaining: number
}

/** total = parcela × quantidade; restante = total − pago (RN-003). */
export function installmentTotals(
  amountPerInstallment: number,
  totalInstallments: number,
  amountPaid: number,
): InstallmentTotals {
  const totalCents = Math.round(amountPerInstallment * 100) * totalInstallments
  const remainingCents = totalCents - Math.round(amountPaid * 100)
  return { total: totalCents / 100, remaining: remainingCents / 100 }
}

/** amount_paid deve estar em [0, total] (RN-004). */
export function isValidAmountPaid(
  amountPerInstallment: number,
  totalInstallments: number,
  amountPaid: number,
): boolean {
  if (amountPaid < 0) return false
  return amountPaid <= installmentTotals(amountPerInstallment, totalInstallments, 0).total
}

/** Rascunho de cobrança/fatura como digitado no formulário (strings cruas). */
export interface InstallmentDraft {
  name: string
  description: string
  amountPerInstallment: string
  totalInstallments: string
  amountPaid: string
  dueDate: string
}

export const emptyInstallmentDraft: InstallmentDraft = {
  name: '',
  description: '',
  amountPerInstallment: '',
  totalInstallments: '1',
  amountPaid: '0',
  dueDate: '',
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function toAmount(raw: string): number {
  return Number(raw.replace(',', '.'))
}

/** Valida o rascunho no cliente (inclui RN-004: pago ≤ parcela × parcelas). Retorna erro ou null. */
export function validateInstallmentDraft(d: InstallmentDraft): string | null {
  const per = toAmount(d.amountPerInstallment)
  const count = Number(d.totalInstallments)
  const paid = toAmount(d.amountPaid || '0')
  if (!per || per <= 0) return 'Informe o valor da parcela'
  if (!count || count < 1) return 'Quantidade de parcelas deve ser ao menos 1'
  if (paid < 0) return 'Valor pago não pode ser negativo'
  if (!isValidAmountPaid(per, count, paid)) return 'Valor pago não pode exceder o total'
  if (d.dueDate && !ISO_DATE.test(d.dueDate)) return 'Data no formato AAAA-MM-DD'
  return null
}

/** Converte o rascunho validado para o input das mutations charges/invoices.create. */
export function parseInstallmentDraft(d: InstallmentDraft) {
  return {
    description: d.description || undefined,
    amountPerInstallment: toAmount(d.amountPerInstallment),
    totalInstallments: Number(d.totalInstallments),
    amountPaid: toAmount(d.amountPaid || '0'),
    dueDate: d.dueDate || undefined,
  }
}

/** Rascunho de fatura (Faturas v2) como digitado no formulário (strings cruas). */
export interface InvoiceDraft {
  name: string
  description: string
  amountPerInstallment: string
  totalInstallments: string
  firstDueDate: string
  categoryId: string
  cardId: string
}

export const emptyInvoiceDraft: InvoiceDraft = {
  name: '',
  description: '',
  amountPerInstallment: '',
  totalInstallments: '1',
  firstDueDate: '',
  categoryId: '',
  cardId: '',
}

/** Valida o rascunho de fatura no cliente. Retorna erro ou null. */
export function validateInvoiceDraft(d: InvoiceDraft): string | null {
  const per = toAmount(d.amountPerInstallment)
  const count = Number(d.totalInstallments)
  if (!per || per <= 0) return 'Informe o valor da parcela'
  if (!count || count < 1) return 'Quantidade de parcelas deve ser ao menos 1'
  if (!d.firstDueDate) return 'Informe o primeiro vencimento'
  if (!ISO_DATE.test(d.firstDueDate)) return 'Data no formato AAAA-MM-DD'
  return null
}

/** Converte o rascunho validado para o input da mutation invoices.create. */
export function parseInvoiceDraft(d: InvoiceDraft) {
  return {
    description: d.description || undefined,
    amountPerInstallment: toAmount(d.amountPerInstallment),
    totalInstallments: Number(d.totalInstallments),
    firstDueDate: d.firstDueDate,
    categoryId: d.categoryId || undefined,
    cardId: d.cardId || undefined,
  }
}
