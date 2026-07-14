import { z } from 'zod'
import { isoDate, money, uuid } from './shared'

/** Validação compartilhada de cobranças e faturas (RN-004): pago ≤ total. */
const installmentBase = z.object({
  description: z.string().max(500).optional(),
  amountPerInstallment: money,
  totalInstallments: z.number().int().min(1),
  amountPaid: z.number().min(0).default(0),
  dueDate: isoDate.optional(),
})

function paidWithinTotal(data: {
  amountPerInstallment: number
  totalInstallments: number
  amountPaid: number
}): boolean {
  const totalCents = Math.round(data.amountPerInstallment * 100) * data.totalInstallments
  return Math.round(data.amountPaid * 100) <= totalCents
}

const paidRefine = { message: 'valor pago não pode exceder o total', path: ['amountPaid'] }

export const createChargeInput = installmentBase
  .extend({
    debtorName: z.string().min(1).max(120),
    status: z.enum(['pendente', 'cobrado', 'pago']).default('pendente'),
  })
  .refine(paidWithinTotal, paidRefine)
export type CreateChargeInput = z.infer<typeof createChargeInput>

export const updateChargeInput = installmentBase
  .extend({
    id: uuid,
    debtorName: z.string().min(1).max(120),
    status: z.enum(['pendente', 'cobrado', 'pago']),
    dueDate: isoDate.nullable().optional(),
    description: z.string().max(500).nullable().optional(),
  })
  .refine(paidWithinTotal, paidRefine)
export type UpdateChargeInput = z.infer<typeof updateChargeInput>

/** Base de fatura (Faturas v2): sem amountPaid/dueDate — pagamento é por parcela (charge-payments). */
const invoiceBase = z.object({
  cardName: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  amountPerInstallment: money,
  totalInstallments: z.number().int().min(1),
  firstDueDate: isoDate,
  categoryId: uuid.optional(),
})

export const createInvoiceInput = invoiceBase.extend({
  cardId: uuid.optional(),
  status: z.enum(['pendente', 'pago']).default('pendente'),
})
export type CreateInvoiceInput = z.infer<typeof createInvoiceInput>

export const updateInvoiceInput = invoiceBase.extend({
  id: uuid,
  cardId: uuid.nullable().optional(),
  categoryId: uuid.nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(['pendente', 'pago']),
})
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceInput>

export const registerInvoicePaymentInput = z.object({
  id: uuid,
  installmentNumber: z.number().int().min(1),
  amount: money,
  paidOn: isoDate,
})
export type RegisterInvoicePaymentInput = z.infer<typeof registerInvoicePaymentInput>

export const updateInvoicePaymentInput = z.object({ paymentId: uuid, amount: money, paidOn: isoDate })
export type UpdateInvoicePaymentInput = z.infer<typeof updateInvoicePaymentInput>

export const unregisterInvoicePaymentInput = z.object({ paymentId: uuid })
export type UnregisterInvoicePaymentInput = z.infer<typeof unregisterInvoicePaymentInput>

export const chargeByIdInput = z.object({ id: uuid })
export type ChargeByIdInput = z.infer<typeof chargeByIdInput>

export const registerChargePaymentInput = z.object({ id: uuid, amount: money })
export type RegisterChargePaymentInput = z.infer<typeof registerChargePaymentInput>

export const unregisterChargePaymentInput = z.object({ paymentId: uuid })
export type UnregisterChargePaymentInput = z.infer<typeof unregisterChargePaymentInput>

export const setChargeStatusInput = z.object({
  id: uuid,
  status: z.enum(['pendente', 'cobrado', 'pago']),
})
export type SetChargeStatusInput = z.infer<typeof setChargeStatusInput>

export const setInvoiceStatusInput = z.object({
  id: uuid,
  status: z.enum(['pendente', 'pago']),
})
export type SetInvoiceStatusInput = z.infer<typeof setInvoiceStatusInput>
