import { z } from 'zod'
import { isoDate, isoMonth, money, transactionType, uuid } from './shared'

export const createFixedExpenseInput = z.object({
  name: z.string().min(1).max(120),
  type: transactionType.default('despesa'),
  amount: money,
  dueDay: z.number().int().min(1).max(31),
  categoryId: uuid.optional(),
})
export type CreateFixedExpenseInput = z.infer<typeof createFixedExpenseInput>

export const updateFixedExpenseInput = createFixedExpenseInput.partial().extend({
  id: uuid,
  categoryId: uuid.nullable().optional(),
  status: z.enum(['active', 'archived']).optional(),
})
export type UpdateFixedExpenseInput = z.infer<typeof updateFixedExpenseInput>

export const listFixedExpensesInput = z.object({
  month: isoMonth,
})
export type ListFixedExpensesInput = z.infer<typeof listFixedExpensesInput>

/** Marca o gasto como pago no mês; cria a transação vinculada (FR-103). */
export const payFixedExpenseInput = z.object({
  id: uuid,
  month: isoMonth,
  paidAt: isoDate.optional(),
})
export type PayFixedExpenseInput = z.infer<typeof payFixedExpenseInput>

/** Desfaz o pagamento do mês; remove a transação vinculada (FR-104). */
export const unpayFixedExpenseInput = z.object({
  id: uuid,
  month: isoMonth,
})
export type UnpayFixedExpenseInput = z.infer<typeof unpayFixedExpenseInput>
