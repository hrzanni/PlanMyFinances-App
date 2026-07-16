import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, seedTestUsers } from '../test/test-db'
import type { DrizzleDB } from '../db/client'
import { categories, subcategories } from '../db/schema'
import { eq } from 'drizzle-orm'
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORY,
  seedDefaultCategoriesForUser,
} from './default-categories'
import { createCategory, updateCategory, deleteCategory } from './categories'

let db: DrizzleDB
let userA: string

beforeEach(async () => {
  db = await createTestDb()
  const users = await seedTestUsers(db)
  userA = users.userA
})

async function categoriesFor(userId: string) {
  return db.select().from(categories).where(eq(categories.userId, userId))
}

async function subcategoriesFor(userId: string) {
  return db.select().from(subcategories).where(eq(subcategories.userId, userId))
}

describe('seedDefaultCategoriesForUser', () => {
  it('cria as categorias de despesa padrão (editáveis) e Salário como sistema', async () => {
    await seedDefaultCategoriesForUser(db, userA)

    const cats = await categoriesFor(userA)
    expect(cats).toHaveLength(DEFAULT_EXPENSE_CATEGORIES.length + 1)

    for (const expected of DEFAULT_EXPENSE_CATEGORIES) {
      const cat = cats.find((c) => c.name === expected.name)
      expect(cat).toMatchObject({ type: 'despesa', isSystem: false })
    }

    const salario = cats.find((c) => c.name === DEFAULT_INCOME_CATEGORY.name)
    expect(salario).toMatchObject({ type: 'receita', isSystem: true })
  })

  it('cria as subcategorias-chave de cada categoria de despesa padrão', async () => {
    await seedDefaultCategoriesForUser(db, userA)

    const cats = await categoriesFor(userA)
    const subs = await subcategoriesFor(userA)

    for (const expected of DEFAULT_EXPENSE_CATEGORIES) {
      const cat = cats.find((c) => c.name === expected.name)!
      const names = subs.filter((s) => s.categoryId === cat.id).map((s) => s.name)
      expect(names.sort()).toEqual([...expected.subcategories].sort())
    }
  })

  it('é idempotente: rodar duas vezes não duplica nada', async () => {
    await seedDefaultCategoriesForUser(db, userA)
    await seedDefaultCategoriesForUser(db, userA)

    const cats = await categoriesFor(userA)
    expect(cats).toHaveLength(DEFAULT_EXPENSE_CATEGORIES.length + 1)

    const subs = await subcategoriesFor(userA)
    const totalExpectedSubs = DEFAULT_EXPENSE_CATEGORIES.reduce(
      (sum, c) => sum + c.subcategories.length,
      0,
    )
    expect(subs).toHaveLength(totalExpectedSubs)
  })

  it('não duplica "Salário" se o usuário já tinha criado a categoria manualmente', async () => {
    const manual = await createCategory(db, userA, { name: 'Salário', type: 'receita' })

    await seedDefaultCategoriesForUser(db, userA)

    const cats = await categoriesFor(userA)
    const salarioCats = cats.filter((c) => c.name === 'Salário')
    expect(salarioCats).toHaveLength(1)
    expect(salarioCats[0]).toMatchObject({ id: manual!.id, isSystem: false })
  })

  it('adiciona subcategorias-chave mesmo quando a categoria-mãe já existia manualmente', async () => {
    await createCategory(db, userA, { name: 'Alimentação', type: 'despesa' })

    await seedDefaultCategoriesForUser(db, userA)

    const cats = await categoriesFor(userA)
    const alimentacao = cats.find((c) => c.name === 'Alimentação')!
    const subs = await subcategoriesFor(userA)
    const names = subs.filter((s) => s.categoryId === alimentacao.id).map((s) => s.name)
    expect(names.sort()).toEqual(['Mercado', 'Restaurante'])
  })

  it('categoria "Salário" de sistema não pode ser editada nem apagada', async () => {
    await seedDefaultCategoriesForUser(db, userA)

    const cats = await categoriesFor(userA)
    const salario = cats.find((c) => c.name === 'Salário')!

    expect(await updateCategory(db, userA, { id: salario.id, name: 'Outro nome' })).toBe(
      'forbidden',
    )
    expect(await deleteCategory(db, userA, salario.id)).toBe('forbidden')
  })
})
