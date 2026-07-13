import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, seedTestUsers } from '../test/test-db'
import type { DrizzleDB } from '../db/client'
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from './transactions'

let db: DrizzleDB
let userA: string
let userB: string

const base = { type: 'despesa' as const, value: 50, date: '2026-07-05' }
const listInput = { limit: 20 }

beforeEach(async () => {
  db = await createTestDb()
  const users = await seedTestUsers(db)
  userA = users.userA
  userB = users.userB
})

describe('transactions service — CRUD', () => {
  it('cria e lista transação do usuário', async () => {
    await createTransaction(db, userA, { ...base, description: 'Mercado' })
    const { items } = await listTransactions(db, userA, listInput)
    expect(items).toHaveLength(1)
    expect(items[0]?.description).toBe('Mercado')
    expect(items[0]?.value).toBe('50.00')
    expect(items[0]?.source).toBe('manual')
  })

  it('atualiza transação própria', async () => {
    const tx = await createTransaction(db, userA, base)
    const updated = await updateTransaction(db, userA, { id: tx!.id, value: 75.5 })
    expect(updated?.value).toBe('75.50')
  })

  it('exclui transação própria', async () => {
    const tx = await createTransaction(db, userA, base)
    const deleted = await deleteTransaction(db, userA, tx!.id)
    expect(deleted?.id).toBe(tx!.id)
    const { items } = await listTransactions(db, userA, listInput)
    expect(items).toHaveLength(0)
  })

  it('filtra por mês e tipo', async () => {
    await createTransaction(db, userA, { ...base, date: '2026-07-10' })
    await createTransaction(db, userA, { ...base, date: '2026-06-10' })
    await createTransaction(db, userA, { type: 'receita', value: 100, date: '2026-07-01' })

    const july = await listTransactions(db, userA, { ...listInput, month: '2026-07' })
    expect(july.items).toHaveLength(2)

    const expenses = await listTransactions(db, userA, {
      ...listInput,
      month: '2026-07',
      type: 'despesa',
    })
    expect(expenses.items).toHaveLength(1)
  })

  it('pagina com cursor por data', async () => {
    for (let day = 1; day <= 5; day++) {
      await createTransaction(db, userA, { ...base, date: `2026-07-0${day}` })
    }
    const page1 = await listTransactions(db, userA, { limit: 2 })
    expect(page1.items).toHaveLength(2)
    expect(page1.nextCursor).not.toBeNull()

    const page2 = await listTransactions(db, userA, { limit: 2, cursor: page1.nextCursor! })
    expect(page2.items).toHaveLength(2)
    const dates1 = page1.items.map((i) => i.date)
    const dates2 = page2.items.map((i) => i.date)
    expect(dates1[0]! > dates2[0]!).toBe(true)
  })
})

describe('transactions service — isolamento por usuário (FR-070/071, SC-004)', () => {
  it('A não vê transações de B', async () => {
    await createTransaction(db, userB, base)
    const { items } = await listTransactions(db, userA, listInput)
    expect(items).toHaveLength(0)
  })

  it('A não atualiza transação de B por id', async () => {
    const txB = await createTransaction(db, userB, base)
    const result = await updateTransaction(db, userA, { id: txB!.id, value: 999 })
    expect(result).toBeNull()
    const { items } = await listTransactions(db, userB, listInput)
    expect(items[0]?.value).toBe('50.00')
  })

  it('A não exclui transação de B por id', async () => {
    const txB = await createTransaction(db, userB, base)
    const result = await deleteTransaction(db, userA, txB!.id)
    expect(result).toBeNull()
    const { items } = await listTransactions(db, userB, listInput)
    expect(items).toHaveLength(1)
  })
})
