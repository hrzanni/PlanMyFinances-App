import { and, asc, desc, eq } from 'drizzle-orm'
import type { CreateInvoiceInput, SetInvoiceStatusInput, UpdateInvoiceInput } from '@pmf/schemas'
import type { DrizzleDB } from '../db/client'
import { categories, invoicePayments, invoices } from '../db/schema'
import { cardBelongsToUser } from './cards'

/** Garante que a categoria referenciada numa fatura pertence ao usuário. */
async function categoryBelongsToUser(
  db: DrizzleDB,
  userId: string,
  categoryId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
  return Boolean(row)
}

/** Lista faturas com categoria (leftJoin) e parcelas pagas (single select, agrupado em memória). */
export async function listInvoices(db: DrizzleDB, userId: string) {
  const rows = await db
    .select({
      id: invoices.id,
      userId: invoices.userId,
      cardName: invoices.cardName,
      cardId: invoices.cardId,
      description: invoices.description,
      amountPerInstallment: invoices.amountPerInstallment,
      totalInstallments: invoices.totalInstallments,
      amountPaid: invoices.amountPaid,
      categoryId: invoices.categoryId,
      categoryName: categories.name,
      firstDueDate: invoices.firstDueDate,
      status: invoices.status,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .leftJoin(categories, eq(invoices.categoryId, categories.id))
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.createdAt))

  const paymentRows = await db
    .select({
      id: invoicePayments.id,
      invoiceId: invoicePayments.invoiceId,
      installmentNumber: invoicePayments.installmentNumber,
      amount: invoicePayments.amount,
      paidOn: invoicePayments.paidOn,
    })
    .from(invoicePayments)
    .where(eq(invoicePayments.userId, userId))
    .orderBy(asc(invoicePayments.installmentNumber))

  const paymentsByInvoice = new Map<string, typeof paymentRows>()
  for (const payment of paymentRows) {
    const list = paymentsByInvoice.get(payment.invoiceId) ?? []
    list.push(payment)
    paymentsByInvoice.set(payment.invoiceId, list)
  }

  return rows.map((row) => ({
    ...row,
    categoryName: row.categoryName ?? null,
    payments: paymentsByInvoice.get(row.id) ?? [],
  }))
}

export async function createInvoice(db: DrizzleDB, userId: string, input: CreateInvoiceInput) {
  const card = await cardBelongsToUser(db, userId, input.cardId)
  if (!card) return 'card_not_found' as const
  if (input.categoryId && !(await categoryBelongsToUser(db, userId, input.categoryId)))
    return 'category_not_found' as const
  const [row] = await db
    .insert(invoices)
    .values({
      userId,
      cardName: card.name,
      cardId: input.cardId,
      description: input.description ?? null,
      amountPerInstallment: input.amountPerInstallment.toFixed(2),
      totalInstallments: input.totalInstallments,
      amountPaid: '0',
      categoryId: input.categoryId ?? null,
      firstDueDate: input.firstDueDate,
      status: input.status,
    })
    .returning()
  return row
}

export async function updateInvoice(db: DrizzleDB, userId: string, input: UpdateInvoiceInput) {
  const card = await cardBelongsToUser(db, userId, input.cardId)
  if (!card) return 'card_not_found' as const
  if (input.categoryId && !(await categoryBelongsToUser(db, userId, input.categoryId)))
    return 'category_not_found' as const
  const [row] = await db
    .update(invoices)
    .set({
      cardName: card.name,
      cardId: input.cardId,
      description: input.description ?? null,
      amountPerInstallment: input.amountPerInstallment.toFixed(2),
      totalInstallments: input.totalInstallments,
      categoryId: input.categoryId ?? null,
      firstDueDate: input.firstDueDate,
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
