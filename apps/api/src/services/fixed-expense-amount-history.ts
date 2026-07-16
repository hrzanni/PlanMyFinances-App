import { desc, eq } from 'drizzle-orm'
import type { DrizzleDB } from '../db/client'
import { fixedExpenseAmountHistory } from '../db/schema'

/** Todo o histórico de valor do usuário, para resolver o valor vigente de cada fixo por mês. */
export function fetchAmountHistoryByUser(db: DrizzleDB, userId: string) {
  return db.select().from(fixedExpenseAmountHistory).where(eq(fixedExpenseAmountHistory.userId, userId))
}

/** Histórico de valor de um único fixo (ex.: para resolver o valor no mês do pagamento). */
export function fetchAmountHistoryByExpense(db: DrizzleDB, fixedExpenseId: string) {
  return db
    .select()
    .from(fixedExpenseAmountHistory)
    .where(eq(fixedExpenseAmountHistory.fixedExpenseId, fixedExpenseId))
}

/** Primeira entrada de valor, criada junto com o fixo. */
export async function insertInitialAmountHistory(
  tx: DrizzleDB,
  input: { userId: string; fixedExpenseId: string; amount: string; effectiveFrom: string },
) {
  await tx.insert(fixedExpenseAmountHistory).values(input)
}

/**
 * Reajuste: insere uma nova entrada de valor a partir de `effectiveFrom`, sem tocar nas
 * anteriores (FR-105 estendido). Rejeita `effectiveFrom` que não seja estritamente posterior
 * à última entrada já registrada, para não abrir uma lacuna no meio do histórico existente.
 */
export async function insertAmountReajuste(
  tx: DrizzleDB,
  input: { userId: string; fixedExpenseId: string; amount: string; effectiveFrom: string },
): Promise<'ok' | 'invalid_amount_effective_from'> {
  const [lastEntry] = await tx
    .select()
    .from(fixedExpenseAmountHistory)
    .where(eq(fixedExpenseAmountHistory.fixedExpenseId, input.fixedExpenseId))
    .orderBy(desc(fixedExpenseAmountHistory.effectiveFrom))
    .limit(1)
  if (lastEntry && input.effectiveFrom <= lastEntry.effectiveFrom) {
    return 'invalid_amount_effective_from'
  }

  await tx.insert(fixedExpenseAmountHistory).values(input)
  return 'ok'
}
