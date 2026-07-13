import { and, desc, eq, ne } from 'drizzle-orm'
import { dueThisMonth, installmentTotals, sumAmounts, toNumber } from '@pmf/core'
import type { CreateChargeInput, SetChargeStatusInput, UpdateChargeInput } from '@pmf/schemas'
import type { DrizzleDB } from '../db/client'
import { charges } from '../db/schema'

export async function listCharges(db: DrizzleDB, userId: string) {
  return db
    .select()
    .from(charges)
    .where(eq(charges.userId, userId))
    .orderBy(desc(charges.createdAt))
}

/** Cards: A receber, Vence este mês, Total recebido (FR-022, RN-005). */
export async function chargesSummary(db: DrizzleDB, userId: string) {
  const rows = await db
    .select()
    .from(charges)
    .where(and(eq(charges.userId, userId), ne(charges.status, 'pago')))
  const allRows = await db.select().from(charges).where(eq(charges.userId, userId))
  const now = new Date()

  const remainingOf = (r: (typeof rows)[number]) =>
    installmentTotals(toNumber(r.amountPerInstallment), r.totalInstallments, toNumber(r.amountPaid))
      .remaining

  const receivable = rows.reduce((acc, r) => acc + remainingOf(r), 0)
  const dueMonth = rows
    .filter((r) => dueThisMonth(r.dueDate, now))
    .reduce((acc, r) => acc + remainingOf(r), 0)
  const received = sumAmounts(allRows.map((r) => r.amountPaid))

  return {
    receivable: Math.round(receivable * 100) / 100,
    dueThisMonth: Math.round(dueMonth * 100) / 100,
    received,
  }
}

export async function createCharge(db: DrizzleDB, userId: string, input: CreateChargeInput) {
  const [row] = await db
    .insert(charges)
    .values({
      userId,
      debtorName: input.debtorName,
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

export async function updateCharge(db: DrizzleDB, userId: string, input: UpdateChargeInput) {
  const [row] = await db
    .update(charges)
    .set({
      debtorName: input.debtorName,
      description: input.description ?? null,
      amountPerInstallment: input.amountPerInstallment.toFixed(2),
      totalInstallments: input.totalInstallments,
      amountPaid: input.amountPaid.toFixed(2),
      dueDate: input.dueDate ?? null,
      status: input.status,
    })
    .where(and(eq(charges.id, input.id), eq(charges.userId, userId)))
    .returning()
  return row ?? null
}

/** Transições de status livres (RN-006). */
export async function setChargeStatus(db: DrizzleDB, userId: string, input: SetChargeStatusInput) {
  const [row] = await db
    .update(charges)
    .set({ status: input.status })
    .where(and(eq(charges.id, input.id), eq(charges.userId, userId)))
    .returning()
  return row ?? null
}

export async function deleteCharge(db: DrizzleDB, userId: string, id: string) {
  const [row] = await db
    .delete(charges)
    .where(and(eq(charges.id, id), eq(charges.userId, userId)))
    .returning({ id: charges.id })
  return row ?? null
}
