import { TRPCError } from '@trpc/server'
import {
  createCategoryInput,
  createSubcategoryInput,
  deleteByIdInput,
  updateCategoryInput,
  updateSubcategoryInput,
} from '@pmf/schemas'
import { router, protectedProcedure } from '../trpc'
import * as service from '../../services/categories'

const notFound = () => new TRPCError({ code: 'NOT_FOUND', message: 'Registro não encontrado' })

export const categoriesRouter = router({
  list: protectedProcedure.query(({ ctx }) => service.listCategories(ctx.db, ctx.userId)),

  create: protectedProcedure
    .input(createCategoryInput)
    .mutation(({ ctx, input }) => service.createCategory(ctx.db, ctx.userId, input)),

  update: protectedProcedure.input(updateCategoryInput).mutation(async ({ ctx, input }) => {
    const row = await service.updateCategory(ctx.db, ctx.userId, input)
    if (!row) throw notFound()
    return row
  }),

  delete: protectedProcedure.input(deleteByIdInput).mutation(async ({ ctx, input }) => {
    const row = await service.deleteCategory(ctx.db, ctx.userId, input.id)
    if (!row) throw notFound()
    return row
  }),

  createSub: protectedProcedure.input(createSubcategoryInput).mutation(async ({ ctx, input }) => {
    const row = await service.createSubcategory(ctx.db, ctx.userId, input)
    if (!row) throw notFound()
    return row
  }),

  updateSub: protectedProcedure.input(updateSubcategoryInput).mutation(async ({ ctx, input }) => {
    const row = await service.updateSubcategory(ctx.db, ctx.userId, input)
    if (!row) throw notFound()
    return row
  }),

  deleteSub: protectedProcedure.input(deleteByIdInput).mutation(async ({ ctx, input }) => {
    const row = await service.deleteSubcategory(ctx.db, ctx.userId, input.id)
    if (!row) throw notFound()
    return row
  }),
})
