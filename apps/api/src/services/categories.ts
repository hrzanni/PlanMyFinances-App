import { and, asc, eq } from 'drizzle-orm'
import type {
  CreateCategoryInput,
  CreateSubcategoryInput,
  UpdateCategoryInput,
  UpdateSubcategoryInput,
} from '@pmf/schemas'
import type { DrizzleDB } from '../db/client'
import { categories, subcategories } from '../db/schema'

export async function listCategories(db: DrizzleDB, userId: string) {
  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.name))
  const subs = await db
    .select()
    .from(subcategories)
    .where(eq(subcategories.userId, userId))
    .orderBy(asc(subcategories.name))
  return cats.map((cat) => ({
    ...cat,
    subcategories: subs.filter((s) => s.categoryId === cat.id),
  }))
}

export async function createCategory(db: DrizzleDB, userId: string, input: CreateCategoryInput) {
  const [row] = await db.insert(categories).values({ userId, ...input }).returning()
  return row
}

export async function updateCategory(db: DrizzleDB, userId: string, input: UpdateCategoryInput) {
  const [row] = await db
    .update(categories)
    .set({ name: input.name })
    .where(and(eq(categories.id, input.id), eq(categories.userId, userId)))
    .returning()
  return row ?? null
}

/** Cascade apaga subcategorias; transações viram "sem categoria" via SET NULL (FR-011). */
export async function deleteCategory(db: DrizzleDB, userId: string, id: string) {
  const [row] = await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning({ id: categories.id })
  return row ?? null
}

export async function createSubcategory(
  db: DrizzleDB,
  userId: string,
  input: CreateSubcategoryInput,
) {
  const [parent] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, input.categoryId), eq(categories.userId, userId)))
  if (!parent) return null
  const [row] = await db.insert(subcategories).values({ userId, ...input }).returning()
  return row
}

export async function updateSubcategory(
  db: DrizzleDB,
  userId: string,
  input: UpdateSubcategoryInput,
) {
  const [row] = await db
    .update(subcategories)
    .set({ name: input.name })
    .where(and(eq(subcategories.id, input.id), eq(subcategories.userId, userId)))
    .returning()
  return row ?? null
}

export async function deleteSubcategory(db: DrizzleDB, userId: string, id: string) {
  const [row] = await db
    .delete(subcategories)
    .where(and(eq(subcategories.id, id), eq(subcategories.userId, userId)))
    .returning({ id: subcategories.id })
  return row ?? null
}
