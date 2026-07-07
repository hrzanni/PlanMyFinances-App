import { TRPCError } from '@trpc/server'
import {
  createFixedExpenseInput,
  deleteByIdInput,
  listFixedExpensesInput,
  payFixedExpenseInput,
  unpayFixedExpenseInput,
  updateFixedExpenseInput,
} from '@pmf/schemas'
import { router, protectedProcedure } from '../trpc'
import * as service from '../../services/fixed-expenses'

const notFound = () => new TRPCError({ code: 'NOT_FOUND', message: 'Gasto fixo não encontrado' })

export const fixedExpensesRouter = router({
  list: protectedProcedure
    .input(listFixedExpensesInput)
    .query(({ ctx, input }) => service.listFixedExpenses(ctx.db, ctx.userId, input.month)),

  create: protectedProcedure
    .input(createFixedExpenseInput)
    .mutation(({ ctx, input }) => service.createFixedExpense(ctx.db, ctx.userId, input)),

  update: protectedProcedure.input(updateFixedExpenseInput).mutation(async ({ ctx, input }) => {
    const row = await service.updateFixedExpense(ctx.db, ctx.userId, input)
    if (!row) throw notFound()
    return row
  }),

  delete: protectedProcedure.input(deleteByIdInput).mutation(async ({ ctx, input }) => {
    const row = await service.deleteFixedExpense(ctx.db, ctx.userId, input.id)
    if (!row) throw notFound()
    return row
  }),

  pay: protectedProcedure.input(payFixedExpenseInput).mutation(async ({ ctx, input }) => {
    const row = await service.payFixedExpense(ctx.db, ctx.userId, input)
    if (!row) throw notFound()
    return row
  }),

  unpay: protectedProcedure.input(unpayFixedExpenseInput).mutation(async ({ ctx, input }) => {
    const row = await service.unpayFixedExpense(ctx.db, ctx.userId, input)
    if (!row) throw notFound()
    return row
  }),
})
