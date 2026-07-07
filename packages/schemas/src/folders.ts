import { z } from 'zod'
import { uuid } from './shared'

export const createFolderInput = z.object({
  name: z.string().min(1).max(120),
  icon: z.string().max(8).optional(),
})
export type CreateFolderInput = z.infer<typeof createFolderInput>

export const updateFolderInput = createFolderInput.partial().extend({
  id: uuid,
  icon: z.string().max(8).nullable().optional(),
  status: z.enum(['active', 'archived']).optional(),
})
export type UpdateFolderInput = z.infer<typeof updateFolderInput>
