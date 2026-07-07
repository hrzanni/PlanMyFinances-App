import { and, asc, count, eq, sql } from 'drizzle-orm'
import type { CreateFolderInput, UpdateFolderInput } from '@pmf/schemas'
import type { DrizzleDB } from '../db/client'
import { folders, transactions } from '../db/schema'

/** Lista pastas com total gasto (só despesas, RN-110) e contagem de transações. */
export async function listFolders(db: DrizzleDB, userId: string) {
  const rows = await db
    .select({
      folder: folders,
      txCount: count(transactions.id),
      totalSpent: sql<string>`coalesce(sum(${transactions.value}) filter (where ${transactions.type} = 'despesa'), 0)`,
    })
    .from(folders)
    .leftJoin(transactions, eq(transactions.folderId, folders.id))
    .where(eq(folders.userId, userId))
    .groupBy(folders.id)
    .orderBy(asc(folders.status), asc(folders.name))

  return rows.map((r) => ({ ...r.folder, txCount: r.txCount, totalSpent: r.totalSpent }))
}

export async function createFolder(db: DrizzleDB, userId: string, input: CreateFolderInput) {
  const [row] = await db.insert(folders).values({ userId, ...input }).returning()
  return row
}

export async function updateFolder(db: DrizzleDB, userId: string, input: UpdateFolderInput) {
  const { id, ...rest } = input
  const [row] = await db
    .update(folders)
    .set(rest)
    .where(and(eq(folders.id, id), eq(folders.userId, userId)))
    .returning()
  return row ?? null
}

/** Excluir pasta mantém as transações (folder_id → NULL via FK, FR-110). */
export async function deleteFolder(db: DrizzleDB, userId: string, id: string) {
  const [row] = await db
    .delete(folders)
    .where(and(eq(folders.id, id), eq(folders.userId, userId)))
    .returning({ id: folders.id })
  return row ?? null
}
