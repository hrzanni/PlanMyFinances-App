import { TRPCError } from '@trpc/server'
import {
  createInvoiceInput,
  deleteByIdInput,
  registerInvoicePaymentInput,
  setInvoiceStatusInput,
  unregisterInvoicePaymentInput,
  updateInvoiceInput,
  updateInvoicePaymentInput,
} from '@pmf/schemas'
import { router, protectedProcedure } from '../trpc'
import * as service from '../../services/invoices'
import * as paymentsService from '../../services/invoice-payments'

const notFound = () => new TRPCError({ code: 'NOT_FOUND', message: 'Fatura não encontrada' })

const cardNotFound = () =>
  new TRPCError({ code: 'NOT_FOUND', message: 'Cartão não encontrado' })
const categoryNotFound = () =>
  new TRPCError({ code: 'BAD_REQUEST', message: 'Categoria não encontrada' })
const paymentNotFound = () =>
  new TRPCError({ code: 'NOT_FOUND', message: 'Pagamento não encontrado' })
const invalidInstallment = () =>
  new TRPCError({ code: 'BAD_REQUEST', message: 'Parcela inexistente nesta fatura' })
const installmentConflict = () =>
  new TRPCError({ code: 'CONFLICT', message: 'Parcela já registrada como paga' })

export const invoicesRouter = router({
  list: protectedProcedure.query(({ ctx }) => service.listInvoices(ctx.db, ctx.userId)),

  create: protectedProcedure.input(createInvoiceInput).mutation(async ({ ctx, input }) => {
    const row = await service.createInvoice(ctx.db, ctx.userId, input)
    if (row === 'card_not_found') throw cardNotFound()
    if (row === 'category_not_found') throw categoryNotFound()
    return row
  }),

  update: protectedProcedure.input(updateInvoiceInput).mutation(async ({ ctx, input }) => {
    const row = await service.updateInvoice(ctx.db, ctx.userId, input)
    if (row === 'card_not_found') throw cardNotFound()
    if (row === 'category_not_found') throw categoryNotFound()
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

  registerPayment: protectedProcedure
    .input(registerInvoicePaymentInput)
    .mutation(async ({ ctx, input }) => {
      const row = await paymentsService.registerInvoicePayment(ctx.db, ctx.userId, input)
      if (row === 'conflict') throw installmentConflict()
      if (row === 'invalid_installment') throw invalidInstallment()
      if (!row) throw notFound()
      return row
    }),

  updatePayment: protectedProcedure
    .input(updateInvoicePaymentInput)
    .mutation(async ({ ctx, input }) => {
      const row = await paymentsService.updateInvoicePayment(ctx.db, ctx.userId, input)
      if (!row) throw paymentNotFound()
      return row
    }),

  unregisterPayment: protectedProcedure
    .input(unregisterInvoicePaymentInput)
    .mutation(async ({ ctx, input }) => {
      const row = await paymentsService.unregisterInvoicePayment(ctx.db, ctx.userId, input)
      if (!row) throw paymentNotFound()
      return row
    }),
})
