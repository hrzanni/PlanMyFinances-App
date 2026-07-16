import { z } from 'zod'
import { uuid } from './shared'

export const createFolderInput = z.object({
  name: z.string().min(1).max(120),
})
export type CreateFolderInput = z.infer<typeof createFolderInput>

export const updateFolderInput = createFolderInput.partial().extend({
  id: uuid,
  status: z.enum(['active', 'archived']).optional(),
})
export type UpdateFolderInput = z.infer<typeof updateFolderInput>

export const folderIdInput = z.object({ id: uuid })
export type FolderIdInput = z.infer<typeof folderIdInput>
