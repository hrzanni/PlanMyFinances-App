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
