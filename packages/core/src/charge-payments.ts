import { installmentTotals } from './installments'

export interface ChargePaymentApplication {
  newAmountPaid: number
  fullyPaid: boolean
}

/**
 * Soma um recebimento parcial ao pago acumulado da cobrança (fase 8.1).
 * Retorna null se o valor for inválido ou o total for excedido (RN-004).
 */
export function applyChargePayment(
  amountPerInstallment: number,
  totalInstallments: number,
  amountPaid: number,
  paymentAmount: number,
): ChargePaymentApplication | null {
  if (paymentAmount <= 0) return null
  const totalCents = Math.round(
    installmentTotals(amountPerInstallment, totalInstallments, 0).total * 100,
  )
  const newPaidCents = Math.round(amountPaid * 100) + Math.round(paymentAmount * 100)
  if (newPaidCents > totalCents) return null
  return { newAmountPaid: newPaidCents / 100, fullyPaid: newPaidCents === totalCents }
}

/** Desfaz um recebimento: subtrai do pago acumulado sem deixar negativo. */
export function revertChargePayment(amountPaid: number, paymentAmount: number): number {
  const cents = Math.round(amountPaid * 100) - Math.round(paymentAmount * 100)
  return Math.max(cents, 0) / 100
}
