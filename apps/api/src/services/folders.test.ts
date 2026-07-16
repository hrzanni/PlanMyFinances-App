import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, seedTestUsers } from '../test/test-db'
import type { DrizzleDB } from '../db/client'
import { createCategory } from './categories'
import { createTransaction } from './transactions'
import { createFolder, folderCategoryBreakdown } from './folders'

let db: DrizzleDB
let userA: string
let userB: string

beforeEach(async () => {
  db = await createTestDb()
  const users = await seedTestUsers(db)
  userA = users.userA
  userB = users.userB
})

describe('folderCategoryBreakdown — quebra por categoria da gaveta de pasta', () => {
  it('pasta sem transações retorna lista vazia', async () => {
    const folder = await createFolder(db, userA, { name: 'Viagem RJ' })
    expect(await folderCategoryBreakdown(db, userA, folder!.id)).toEqual([])
  })

  it('uma categoria só soma 100%', async () => {
    const folder = await createFolder(db, userA, { name: 'Viagem RJ' })
    const cat = await createCategory(db, userA, { name: 'Hospedagem', type: 'despesa' })
    await createTransaction(db, userA, {
      type: 'despesa',
      value: 780,
      date: '2026-07-04',
      folderId: folder!.id,
      categoryId: cat!.id,
    })

    expect(await folderCategoryBreakdown(db, userA, folder!.id)).toEqual([
      { categoryId: cat!.id, categoryName: 'Hospedagem', total: 780, percent: 100 },
    ])
  })

  it('agrupa múltiplas categorias, ordenado desc, incluindo sem categoria', async () => {
    const folder = await createFolder(db, userA, { name: 'Viagem RJ' })
    const transporte = await createCategory(db, userA, { name: 'Transporte', type: 'despesa' })
    const comida = await createCategory(db, userA, { name: 'Alimentação', type: 'despesa' })
    await createTransaction(db, userA, {
      type: 'despesa',
      value: 620,
      date: '2026-07-03',
      folderId: folder!.id,
      categoryId: transporte!.id,
    })
    await createTransaction(db, userA, {
      type: 'despesa',
      value: 145,
      date: '2026-07-05',
      folderId: folder!.id,
      categoryId: comida!.id,
    })
    await createTransaction(db, userA, {
      type: 'despesa',
      value: 35,
      date: '2026-07-06',
      folderId: folder!.id,
    })

    const result = await folderCategoryBreakdown(db, userA, folder!.id)
    expect(result.map((r) => r.categoryName)).toEqual(['Transporte', 'Alimentação', null])
    expect(result[0]).toEqual({
      categoryId: transporte!.id,
      categoryName: 'Transporte',
      total: 620,
      percent: 77.5,
    })
  })

  it('receita na pasta não entra na soma (RN-110)', async () => {
    const folder = await createFolder(db, userA, { name: 'Viagem RJ' })
    const cat = await createCategory(db, userA, { name: 'Salário', type: 'receita' })
    await createTransaction(db, userA, {
      type: 'receita',
      value: 500,
      date: '2026-07-01',
      folderId: folder!.id,
      categoryId: cat!.id,
    })

    expect(await folderCategoryBreakdown(db, userA, folder!.id)).toEqual([])
  })

  it('não vaza transações de outra pasta ou de outro usuário', async () => {
    const folder = await createFolder(db, userA, { name: 'Viagem RJ' })
    const otherFolder = await createFolder(db, userA, { name: 'Reforma' })
    const otherUserFolder = await createFolder(db, userB, { name: 'Pasta do B' })
    const cat = await createCategory(db, userA, { name: 'Lazer', type: 'despesa' })
    await createTransaction(db, userA, {
      type: 'despesa',
      value: 120,
      date: '2026-07-06',
      folderId: otherFolder!.id,
      categoryId: cat!.id,
    })
    await createTransaction(db, userB, {
      type: 'despesa',
      value: 999,
      date: '2026-07-06',
      folderId: otherUserFolder!.id,
    })

    expect(await folderCategoryBreakdown(db, userA, folder!.id)).toEqual([])
  })

  it('pasta de outro usuário ou inexistente retorna lista vazia, sem erro', async () => {
    expect(await folderCategoryBreakdown(db, userA, '00000000-0000-0000-0000-000000000000')).toEqual(
      [],
    )
  })
})
