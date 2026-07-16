import { toNumber, type ChargeForState, type InstallmentDraft } from '@pmf/core'
import type { RouterOutputs } from '@/lib/trpc'

export type ChargeRow = RouterOutputs['charges']['list'][number]

/** Adapta o formato do banco (numeric como string) pro shape puro esperado por @pmf/core. */
export function toChargeState(charge: ChargeRow): ChargeForState {
  return {
    amountPerInstallment: toNumber(charge.amountPerInstallment),
    totalInstallments: charge.totalInstallments,
    amountPaid: toNumber(charge.amountPaid),
    dueDate: charge.dueDate,
    status: charge.status,
  }
}

/** Pré-preenche o formulário de edição a partir da cobrança carregada. */
export function chargeToDraft(charge: ChargeRow): InstallmentDraft {
  return {
    name: charge.debtorName,
    description: charge.description ?? '',
    amountPerInstallment: charge.amountPerInstallment,
    totalInstallments: String(charge.totalInstallments),
    amountPaid: charge.amountPaid,
    dueDate: charge.dueDate ?? '',
  }
}
