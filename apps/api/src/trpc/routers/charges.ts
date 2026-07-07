import { TRPCError } from '@trpc/server'
import {
  createChargeInput,
  deleteByIdInput,
  setChargeStatusInput,
  updateChargeInput,
} from '@pmf/schemas'
import { router, protectedProcedure } from '../trpc'
import * as service from '../../services/charges'

const notFound = () => new TRPCError({ code: 'NOT_FOUND', message: 'Cobrança não encontrada' })

export const chargesRouter = router({
  list: protectedProcedure.query(({ ctx }) => service.listCharges(ctx.db, ctx.userId)),

  summary: protectedProcedure.query(({ ctx }) => service.chargesSummary(ctx.db, ctx.userId)),

  create: protectedProcedure
    .input(createChargeInput)
    .mutation(({ ctx, input }) => service.createCharge(ctx.db, ctx.userId, input)),

  update: protectedProcedure.input(updateChargeInput).mutation(async ({ ctx, input }) => {
    const row = await service.updateCharge(ctx.db, ctx.userId, input)
    if (!row) throw notFound()
    return row
  }),

  setStatus: protectedProcedure.input(setChargeStatusInput).mutation(async ({ ctx, input }) => {
    const row = await service.setChargeStatus(ctx.db, ctx.userId, input)
    if (!row) throw notFound()
    return row
  }),

  delete: protectedProcedure.input(deleteByIdInput).mutation(async ({ ctx, input }) => {
    const row = await service.deleteCharge(ctx.db, ctx.userId, input.id)
    if (!row) throw notFound()
    return row
  }),
})
