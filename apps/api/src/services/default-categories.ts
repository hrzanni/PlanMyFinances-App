import { and, eq } from 'drizzle-orm'
import type { DrizzleDB } from '../db/client'
import { categories, subcategories } from '../db/schema'

type TxType = 'receita' | 'despesa'

type DefaultExpenseCategory = { name: string; subcategories: string[] }

export const DEFAULT_EXPENSE_CATEGORIES: DefaultExpenseCategory[] = [
  { name: 'Moradia', subcategories: ['Contas (água/luz/gás)'] },
  { name: 'Alimentação', subcategories: ['Mercado', 'Restaurante'] },
  { name: 'Transporte', subcategories: ['Combustível', 'Uber'] },
  { name: 'Saúde', subcategories: ['Plano de saúde', 'Farmácia'] },
  { name: 'Assinaturas', subcategories: ['Streaming', 'Software/Apps'] },
]

export const DEFAULT_INCOME_CATEGORY = { name: 'Salário', type: 'receita' as const }

async function findCategoryByNameAndType(db: DrizzleDB, userId: string, name: string, type: TxType) {
  const [existing] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.name, name), eq(categories.type, type)))
  return existing ?? null
}

/**
 * Busca por nome+tipo ignora `isSystem` de propósito: se o usuário já tiver criado
 * manualmente uma categoria com o mesmo nome, ela é reaproveitada em vez de duplicada.
 */
async function getOrCreateDefaultCategory(
  db: DrizzleDB,
  userId: string,
  name: string,
  type: TxType,
  isSystem: boolean,
) {
  const existing = await findCategoryByNameAndType(db, userId, name, type)
  if (existing) return existing
  const [row] = await db.insert(categories).values({ userId, name, type, isSystem }).returning()
  return row!
}

async function ensureSubcategory(db: DrizzleDB, userId: string, categoryId: string, name: string) {
  const [existing] = await db
    .select()
    .from(subcategories)
    .where(
      and(
        eq(subcategories.userId, userId),
        eq(subcategories.categoryId, categoryId),
        eq(subcategories.name, name),
      ),
    )
  if (existing) return
  await db.insert(subcategories).values({ userId, categoryId, name })
}

/**
 * Semeia categorias/subcategorias padrão de um usuário (cadastro novo ou backfill).
 * Idempotente: seguro chamar mais de uma vez para o mesmo usuário.
 */
export async function seedDefaultCategoriesForUser(db: DrizzleDB, userId: string) {
  await getOrCreateDefaultCategory(
    db,
    userId,
    DEFAULT_INCOME_CATEGORY.name,
    DEFAULT_INCOME_CATEGORY.type,
    true,
  )

  for (const category of DEFAULT_EXPENSE_CATEGORIES) {
    const row = await getOrCreateDefaultCategory(db, userId, category.name, 'despesa', false)
    for (const subName of category.subcategories) {
      await ensureSubcategory(db, userId, row.id, subName)
    }
  }
}
