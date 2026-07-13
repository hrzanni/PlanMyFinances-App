import { z } from 'zod'
import { transactionType, uuid } from './shared'

export const createCategoryInput = z.object({
  name: z.string().min(1).max(80),
  type: transactionType,
})
export type CreateCategoryInput = z.infer<typeof createCategoryInput>

export const updateCategoryInput = z.object({
  id: uuid,
  name: z.string().min(1).max(80),
})
export type UpdateCategoryInput = z.infer<typeof updateCategoryInput>

export const createSubcategoryInput = z.object({
  categoryId: uuid,
  name: z.string().min(1).max(80),
})
export type CreateSubcategoryInput = z.infer<typeof createSubcategoryInput>

export const updateSubcategoryInput = z.object({
  id: uuid,
  name: z.string().min(1).max(80),
})
export type UpdateSubcategoryInput = z.infer<typeof updateSubcategoryInput>
