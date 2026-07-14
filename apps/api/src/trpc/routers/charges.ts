import { TRPCError } from '@trpc/server'
import {
  chargeByIdInput,
  createChargeInput,
  deleteByIdInput,
  registerChargePaymentInput,
  setChargeStatusInput,
  unregisterChargePaymentInput,
  updateChargeInput,
} from '@pmf/schemas'
import { router, protectedProcedure } from '../trpc'
import * as service from '../../services/charges'
import * as payments from '../../services/charge-payments'

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

  payments: protectedProcedure
    .input(chargeByIdInput)
    .query(({ ctx, input }) => payments.listChargePayments(ctx.db, ctx.userId, input.id)),

  registerPayment: protectedProcedure
    .input(registerChargePaymentInput)
    .mutation(async ({ ctx, input }) => {
      const row = await payments.registerChargePayment(ctx.db, ctx.userId, input)
      if (!row) throw notFound()
      if (row === 'exceeds_total')
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Valor recebido não pode exceder o restante da cobrança',
        })
      return row
    }),

  unregisterPayment: protectedProcedure
    .input(unregisterChargePaymentInput)
    .mutation(async ({ ctx, input }) => {
      const row = await payments.unregisterChargePayment(ctx.db, ctx.userId, input)
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Recebimento não encontrado' })
      return row
    }),
})
