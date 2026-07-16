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

export const updateFixedExpenseInput = createFixedExpenseInput
  .partial()
  .extend({
    id: uuid,
    categoryId: uuid.nullable().optional(),
    status: z.enum(['active', 'archived']).optional(),
    /** Obrigatório quando `amount` é enviado: a partir de qual mês o novo valor vale (reajuste). */
    amountEffectiveFrom: isoMonth.optional(),
  })
  .refine((v) => v.amount == null || v.amountEffectiveFrom != null, {
    message: 'amountEffectiveFrom é obrigatório ao alterar o valor (reajuste)',
    path: ['amountEffectiveFrom'],
  })
export type UpdateFixedExpenseInput = z.infer<typeof updateFixedExpenseInput>

export const listFixedExpensesInput = z.object({
  month: isoMonth,
})
export type ListFixedExpensesInput = z.infer<typeof listFixedExpensesInput>

/** Encerra o fixo a partir do mês seguinte a lastActiveMonth; preserva todo o histórico. */
export const endFixedExpenseInput = z.object({
  id: uuid,
  lastActiveMonth: isoMonth,
})
export type EndFixedExpenseInput = z.infer<typeof endFixedExpenseInput>

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
