import { TRPCError } from '@trpc/server'
import { createCardInput, deleteByIdInput, updateCardInput } from '@pmf/schemas'
import { router, protectedProcedure } from '../trpc'
import * as service from '../../services/cards'

const notFound = () => new TRPCError({ code: 'NOT_FOUND', message: 'Cartão não encontrado' })

export const cardsRouter = router({
  list: protectedProcedure.query(({ ctx }) => service.listCards(ctx.db, ctx.userId)),

  create: protectedProcedure
    .input(createCardInput)
    .mutation(({ ctx, input }) => service.createCard(ctx.db, ctx.userId, input)),

  update: protectedProcedure.input(updateCardInput).mutation(async ({ ctx, input }) => {
    const row = await service.updateCard(ctx.db, ctx.userId, input)
    if (!row) throw notFound()
    return row
  }),

  delete: protectedProcedure.input(deleteByIdInput).mutation(async ({ ctx, input }) => {
    const row = await service.deleteCard(ctx.db, ctx.userId, input.id)
    if (!row) throw notFound()
    return row
  }),
})
