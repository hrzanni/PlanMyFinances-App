import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, seedTestUsers } from '../test/test-db'
import type { DrizzleDB } from '../db/client'
import { createCategory } from './categories'
import { createTransaction } from './transactions'
import { monthSummary } from './summary'

let db: DrizzleDB
let userA: string

beforeEach(async () => {
  db = await createTestDb()
  const users = await seedTestUsers(db)
  userA = users.userA
})

describe('monthSummary — despesas por categoria (pizza da Início)', () => {
  it('agrega despesas do mês por categoria, incluindo sem categoria', async () => {
    const cat = await createCategory(db, userA, { name: 'Alimentação', type: 'despesa' })
    await createTransaction(db, userA, {
      type: 'despesa',
      value: 75,
      date: '2026-07-05',
      categoryId: cat!.id,
    })
    await createTransaction(db, userA, { type: 'despesa', value: 25, date: '2026-07-10' })
    await createTransaction(db, userA, { type: 'receita', value: 500, date: '2026-07-01' })
    await createTransaction(db, userA, { type: 'despesa', value: 999, date: '2026-06-10' })

    const summary = await monthSummary(db, userA, '2026-07')
    expect(summary.byCategory).toEqual([
      { categoryId: cat!.id, categoryName: 'Alimentação', total: 75, percent: 75 },
      { categoryId: null, categoryName: null, total: 25, percent: 25 },
    ])
  })
})
