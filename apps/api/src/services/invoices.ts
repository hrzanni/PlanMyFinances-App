import { and, desc, eq } from 'drizzle-orm'
import { dueThisMonth, installmentTotals, sumAmounts, toNumber } from '@pmf/core'
import type { CreateInvoiceInput, SetInvoiceStatusInput, UpdateInvoiceInput } from '@pmf/schemas'
import type { DrizzleDB } from '../db/client'
import { invoices } from '../db/schema'

export async function listInvoices(db: DrizzleDB, userId: string) {
  return db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.createdAt))
}

/** Cards: Em aberto, Vence este mês, Total pago (FR-031, RN-005). */
export async function invoicesSummary(db: DrizzleDB, userId: string) {
  const allRows = await db.select().from(invoices).where(eq(invoices.userId, userId))
  const pending = allRows.filter((r) => r.status === 'pendente')
  const now = new Date()

  const remainingOf = (r: (typeof allRows)[number]) =>
    installmentTotals(toNumber(r.amountPerInstallment), r.totalInstallments, toNumber(r.amountPaid))
      .remaining

  const open = pending.reduce((acc, r) => acc + remainingOf(r), 0)
  const dueMonth = pending
    .filter((r) => dueThisMonth(r.dueDate, now))
    .reduce((acc, r) => acc + remainingOf(r), 0)
  const paid = sumAmounts(allRows.map((r) => r.amountPaid))

  return {
    open: Math.round(open * 100) / 100,
    dueThisMonth: Math.round(dueMonth * 100) / 100,
    paid,
  }
}

export async function createInvoice(db: DrizzleDB, userId: string, input: CreateInvoiceInput) {
  const [row] = await db
    .insert(invoices)
    .values({
      userId,
      cardName: input.cardName,
      description: input.description ?? null,
      amountPerInstallment: input.amountPerInstallment.toFixed(2),
      totalInstallments: input.totalInstallments,
      amountPaid: input.amountPaid.toFixed(2),
      dueDate: input.dueDate ?? null,
      status: input.status,
    })
    .returning()
  return row
}

export async function updateInvoice(db: DrizzleDB, userId: string, input: UpdateInvoiceInput) {
  const [row] = await db
    .update(invoices)
    .set({
      cardName: input.cardName,
      description: input.description ?? null,
      amountPerInstallment: input.amountPerInstallment.toFixed(2),
      totalInstallments: input.totalInstallments,
      amountPaid: input.amountPaid.toFixed(2),
      dueDate: input.dueDate ?? null,
      status: input.status,
    })
    .where(and(eq(invoices.id, input.id), eq(invoices.userId, userId)))
    .returning()
  return row ?? null
}

export async function setInvoiceStatus(
  db: DrizzleDB,
  userId: string,
  input: SetInvoiceStatusInput,
) {
  const [row] = await db
    .update(invoices)
    .set({ status: input.status })
    .where(and(eq(invoices.id, input.id), eq(invoices.userId, userId)))
    .returning()
  return row ?? null
}

export async function deleteInvoice(db: DrizzleDB, userId: string, id: string) {
  const [row] = await db
    .delete(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
    .returning({ id: invoices.id })
  return row ?? null
}
