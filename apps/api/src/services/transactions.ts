import { and, desc, eq, gte, isNull, lte, lt, or, type SQL } from 'drizzle-orm'
import { monthRange } from '@pmf/core'
import type {
  CreateTransactionInput,
  ListTransactionsInput,
  UpdateTransactionInput,
} from '@pmf/schemas'
import type { DrizzleDB } from '../db/client'
import { transactions } from '../db/schema'
import { cardBelongsToUser } from './cards'

// Todas as funções recebem userId da identidade e filtram por ele (FR-070).

function listFilters(userId: string, input: ListTransactionsInput): SQL[] {
  const filters: SQL[] = [eq(transactions.userId, userId)]
  if (input.type) filters.push(eq(transactions.type, input.type))
  if (input.categoryId) filters.push(eq(transactions.categoryId, input.categoryId))
  if (input.subcategoryId) filters.push(eq(transactions.subcategoryId, input.subcategoryId))
  if (input.folderId) filters.push(eq(transactions.folderId, input.folderId))
  if (input.cardId) filters.push(eq(transactions.cardId, input.cardId))
  if (input.uncategorized) filters.push(isNull(transactions.categoryId))
  if (input.month) {
    const { from, to } = monthRange(new Date(`${input.month}-15T12:00:00Z`))
    filters.push(gte(transactions.date, from), lte(transactions.date, to))
  }
  if (input.dateFrom) filters.push(gte(transactions.date, input.dateFrom))
  if (input.dateTo) filters.push(lte(transactions.date, input.dateTo))
  return filters
}

export async function listTransactions(db: DrizzleDB, userId: string, input: ListTransactionsInput) {
  const filters = listFilters(userId, input)
  if (input.cursor) {
    const [cursorDate, cursorId] = input.cursor.split('_')
    if (cursorDate && cursorId) {
      const older = lt(transactions.date, cursorDate)
      const tieBreak = and(eq(transactions.date, cursorDate), lt(transactions.id, cursorId))
      filters.push(or(older, tieBreak) as SQL)
    }
  }
  const rows = await db
    .select()
    .from(transactions)
    .where(and(...filters))
    .orderBy(desc(transactions.date), desc(transactions.createdAt), desc(transactions.id))
    .limit(input.limit + 1)

  const hasMore = rows.length > input.limit
  const items = hasMore ? rows.slice(0, input.limit) : rows
  const last = items[items.length - 1]
  return {
    items,
    nextCursor: hasMore && last ? `${last.date}_${last.id}` : null,
  }
}

export async function createTransaction(
  db: DrizzleDB,
  userId: string,
  input: CreateTransactionInput,
) {
  if (input.cardId && !(await cardBelongsToUser(db, userId, input.cardId))) return null
  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      type: input.type,
      value: input.value.toFixed(2),
      description: input.description ?? null,
      categoryId: input.categoryId ?? null,
      subcategoryId: input.subcategoryId ?? null,
      folderId: input.folderId ?? null,
      cardId: input.cardId ?? null,
      date: input.date,
    })
    .returning()
  return row
}

export async function updateTransaction(
  db: DrizzleDB,
  userId: string,
  input: UpdateTransactionInput,
) {
  if (input.cardId && !(await cardBelongsToUser(db, userId, input.cardId))) return null
  const { id, value, ...rest } = input
  const [row] = await db
    .update(transactions)
    .set({ ...rest, ...(value != null ? { value: value.toFixed(2) } : {}) })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning()
  return row ?? null
}

export async function deleteTransaction(db: DrizzleDB, userId: string, id: string) {
  const [row] = await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning({ id: transactions.id })
  return row ?? null
}
