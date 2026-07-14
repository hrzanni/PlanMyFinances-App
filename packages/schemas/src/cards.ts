import { z } from 'zod'
import { uuid } from './shared'

export const bankPreset = z.enum([
  'nubank',
  'inter',
  'banco_do_brasil',
  'santander',
  'caixa',
  'outro',
])
export type BankPreset = z.infer<typeof bankPreset>

export const createCardInput = z.object({
  name: z.string().min(1).max(120),
  bankPreset: bankPreset.default('outro'),
})
export type CreateCardInput = z.infer<typeof createCardInput>

export const updateCardInput = z.object({
  id: uuid,
  name: z.string().min(1).max(120),
  bankPreset,
})
export type UpdateCardInput = z.infer<typeof updateCardInput>
