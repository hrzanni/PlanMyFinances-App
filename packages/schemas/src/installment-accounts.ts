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

export const createInvoiceInput = installmentBase
  .extend({
    cardName: z.string().min(1).max(120),
    status: z.enum(['pendente', 'pago']).default('pendente'),
  })
  .refine(paidWithinTotal, paidRefine)
export type CreateInvoiceInput = z.infer<typeof createInvoiceInput>

export const updateInvoiceInput = installmentBase
  .extend({
    id: uuid,
    cardName: z.string().min(1).max(120),
    status: z.enum(['pendente', 'pago']),
    dueDate: isoDate.nullable().optional(),
    description: z.string().max(500).nullable().optional(),
  })
  .refine(paidWithinTotal, paidRefine)
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceInput>

export const setStatusInput = z.object({
  id: uuid,
  status: z.string().min(1),
})
export type SetStatusInput = z.infer<typeof setStatusInput>
