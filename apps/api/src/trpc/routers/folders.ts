import { TRPCError } from '@trpc/server'
import {
  createFolderInput,
  deleteByIdInput,
  folderIdInput,
  updateFolderInput,
} from '@pmf/schemas'
import { router, protectedProcedure } from '../trpc'
import * as service from '../../services/folders'

const notFound = () => new TRPCError({ code: 'NOT_FOUND', message: 'Pasta não encontrada' })

export const foldersRouter = router({
  list: protectedProcedure.query(({ ctx }) => service.listFolders(ctx.db, ctx.userId)),

  categoryBreakdown: protectedProcedure
    .input(folderIdInput)
    .query(({ ctx, input }) => service.folderCategoryBreakdown(ctx.db, ctx.userId, input.id)),

  create: protectedProcedure
    .input(createFolderInput)
    .mutation(({ ctx, input }) => service.createFolder(ctx.db, ctx.userId, input)),

  update: protectedProcedure.input(updateFolderInput).mutation(async ({ ctx, input }) => {
    const row = await service.updateFolder(ctx.db, ctx.userId, input)
    if (!row) throw notFound()
    return row
  }),

  delete: protectedProcedure.input(deleteByIdInput).mutation(async ({ ctx, input }) => {
    const row = await service.deleteFolder(ctx.db, ctx.userId, input.id)
    if (!row) throw notFound()
    return row
  }),
})
