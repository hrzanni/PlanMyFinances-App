import { and, asc, count, eq } from 'drizzle-orm'
import type { CreateCardInput, UpdateCardInput } from '@pmf/schemas'
import type { DrizzleDB } from '../db/client'
import { cards, transactions } from '../db/schema'

/** Lista com contagem de transações vinculadas (mostra qual cartão é mais usado). */
export async function listCards(db: DrizzleDB, userId: string) {
  return db
    .select({
      id: cards.id,
      name: cards.name,
      bankPreset: cards.bankPreset,
      createdAt: cards.createdAt,
      txCount: count(transactions.id),
    })
    .from(cards)
    .leftJoin(
      transactions,
      and(eq(transactions.cardId, cards.id), eq(transactions.userId, userId)),
    )
    .where(eq(cards.userId, userId))
    .groupBy(cards.id)
    .orderBy(asc(cards.name))
}

export async function createCard(db: DrizzleDB, userId: string, input: CreateCardInput) {
  const [row] = await db
    .insert(cards)
    .values({ userId, name: input.name, bankPreset: input.bankPreset })
    .returning()
  return row
}

export async function updateCard(db: DrizzleDB, userId: string, input: UpdateCardInput) {
  const [row] = await db
    .update(cards)
    .set({ name: input.name, bankPreset: input.bankPreset })
    .where(and(eq(cards.id, input.id), eq(cards.userId, userId)))
    .returning()
  return row ?? null
}

/** Faturas e transações vinculadas ficam com card_id nulo (SET NULL), nada é apagado junto. */
export async function deleteCard(db: DrizzleDB, userId: string, id: string) {
  const [row] = await db
    .delete(cards)
    .where(and(eq(cards.id, id), eq(cards.userId, userId)))
    .returning({ id: cards.id })
  return row ?? null
}

/** Garante que o cartão referenciado numa mutação de outro domínio pertence ao usuário. */
export async function cardBelongsToUser(
  db: DrizzleDB,
  userId: string,
  cardId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: cards.id })
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
  return Boolean(row)
}
