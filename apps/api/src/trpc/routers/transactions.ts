import { TRPCError } from '@trpc/server'
import {
  createTransactionInput,
  deleteByIdInput,
  listTransactionsInput,
  updateTransactionInput,
} from '@pmf/schemas'
import { router, protectedProcedure } from '../trpc'
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from '../../services/transactions'

export const transactionsRouter = router({
  list: protectedProcedure.input(listTransactionsInput).query(({ ctx, input }) => {
    return listTransactions(ctx.db, ctx.userId, input)
  }),

  create: protectedProcedure.input(createTransactionInput).mutation(async ({ ctx, input }) => {
    const row = await createTransaction(ctx.db, ctx.userId, input)
    if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Cartão não encontrado' })
    return row
  }),

  update: protectedProcedure.input(updateTransactionInput).mutation(async ({ ctx, input }) => {
    const row = await updateTransaction(ctx.db, ctx.userId, input)
    if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Transação não encontrada' })
    return row
  }),

  delete: protectedProcedure.input(deleteByIdInput).mutation(async ({ ctx, input }) => {
    const row = await deleteTransaction(ctx.db, ctx.userId, input.id)
    if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Transação não encontrada' })
    return row
  }),
})
