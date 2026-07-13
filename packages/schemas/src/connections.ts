import { z } from 'zod'
import { uuid } from './shared'

/** Vincula um item já conectado no Meu Pluggy à conta do usuário (FR-120). */
export const registerConnectionInput = z.object({
  pluggyItemId: z.string().min(1),
})
export type RegisterConnectionInput = z.infer<typeof registerConnectionInput>

export const syncConnectionInput = z.object({
  id: uuid.optional(),
})
export type SyncConnectionInput = z.infer<typeof syncConnectionInput>

export const removeConnectionInput = z.object({ id: uuid })
export type RemoveConnectionInput = z.infer<typeof removeConnectionInput>
