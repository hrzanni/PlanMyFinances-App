import { z } from 'zod'
import { isoDate, isoMonth, money, transactionType, uuid } from './shared'

export const createTransactionInput = z.object({
  type: transactionType,
  value: money,
  date: isoDate,
  description: z.string().max(500).optional(),
  categoryId: uuid.optional(),
  subcategoryId: uuid.optional(),
  folderId: uuid.optional(),
})
export type CreateTransactionInput = z.infer<typeof createTransactionInput>

export const updateTransactionInput = createTransactionInput.partial().extend({
  id: uuid,
  description: z.string().max(500).nullable().optional(),
  categoryId: uuid.nullable().optional(),
  subcategoryId: uuid.nullable().optional(),
  folderId: uuid.nullable().optional(),
})
export type UpdateTransactionInput = z.infer<typeof updateTransactionInput>

export const listTransactionsInput = z.object({
  month: isoMonth.optional(),
  type: transactionType.optional(),
  categoryId: uuid.optional(),
  subcategoryId: uuid.optional(),
  folderId: uuid.optional(),
  uncategorized: z.boolean().optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
})
export type ListTransactionsInput = z.infer<typeof listTransactionsInput>

export const deleteByIdInput = z.object({ id: uuid })
export type DeleteByIdInput = z.infer<typeof deleteByIdInput>
