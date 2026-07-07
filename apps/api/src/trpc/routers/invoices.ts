import { TRPCError } from '@trpc/server'
import {
  createInvoiceInput,
  deleteByIdInput,
  setInvoiceStatusInput,
  updateInvoiceInput,
} from '@pmf/schemas'
import { router, protectedProcedure } from '../trpc'
import * as service from '../../services/invoices'

const notFound = () => new TRPCError({ code: 'NOT_FOUND', message: 'Fatura não encontrada' })

export const invoicesRouter = router({
  list: protectedProcedure.query(({ ctx }) => service.listInvoices(ctx.db, ctx.userId)),

  summary: protectedProcedure.query(({ ctx }) => service.invoicesSummary(ctx.db, ctx.userId)),

  create: protectedProcedure
    .input(createInvoiceInput)
    .mutation(({ ctx, input }) => service.createInvoice(ctx.db, ctx.userId, input)),

  update: protectedProcedure.input(updateInvoiceInput).mutation(async ({ ctx, input }) => {
    const row = await service.updateInvoice(ctx.db, ctx.userId, input)
    if (!row) throw notFound()
    return row
  }),

  setStatus: protectedProcedure.input(setInvoiceStatusInput).mutation(async ({ ctx, input }) => {
    const row = await service.setInvoiceStatus(ctx.db, ctx.userId, input)
    if (!row) throw notFound()
    return row
  }),

  delete: protectedProcedure.input(deleteByIdInput).mutation(async ({ ctx, input }) => {
    const row = await service.deleteInvoice(ctx.db, ctx.userId, input.id)
    if (!row) throw notFound()
    return row
  }),
})
