import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, seedTestUsers } from '../test/test-db'
import type { DrizzleDB } from '../db/client'
import {
  createFixedExpense,
  listFixedExpenses,
  payFixedExpense,
  unpayFixedExpense,
  updateFixedExpense,
} from './fixed-expenses'
import { listTransactions } from './transactions'

let db: DrizzleDB
let userA: string
let userB: string

beforeEach(async () => {
  db = await createTestDb()
  const users = await seedTestUsers(db)
  userA = users.userA
  userB = users.userB
})

async function createRent(userId: string) {
  const expense = await createFixedExpense(db, userId, {
    name: 'Aluguel',
    amount: 1850,
    dueDay: 5,
  })
  return expense!
}

describe('fixed expenses — pagar/despagar (FR-103/104, SC-100)', () => {
  it('pagar cria payment com snapshot e transação de despesa vinculada', async () => {
    const rent = await createRent(userA)
    const payment = await payFixedExpense(db, userA, { id: rent.id, month: '2026-07' })

    expect(payment?.amount).toBe('1850.00')
    expect(payment?.referenceMonth).toBe('2026-07-01')
    expect(payment?.transactionId).not.toBeNull()

    const { items } = await listTransactions(db, userA, { limit: 10 })
    expect(items).toHaveLength(1)
    expect(items[0]?.source).toBe('fixed_expense')
    expect(items[0]?.value).toBe('1850.00')
    expect(items[0]?.description).toBe('Aluguel')
  })

  it('pagar duas vezes o mesmo mês é no-op', async () => {
    const rent = await createRent(userA)
    const first = await payFixedExpense(db, userA, { id: rent.id, month: '2026-07' })
    const second = await payFixedExpense(db, userA, { id: rent.id, month: '2026-07' })
    expect(second?.id).toBe(first?.id)

    const { items } = await listTransactions(db, userA, { limit: 10 })
    expect(items).toHaveLength(1)
  })

  it('despagar remove payment e transação juntos, nada fica órfão', async () => {
    const rent = await createRent(userA)
    await payFixedExpense(db, userA, { id: rent.id, month: '2026-07' })
    const result = await unpayFixedExpense(db, userA, { id: rent.id, month: '2026-07' })
    expect(result).not.toBeNull()

    const { items } = await listTransactions(db, userA, { limit: 10 })
    expect(items).toHaveLength(0)

    const list = await listFixedExpenses(db, userA, '2026-07')
    expect(list.items[0]?.payment).toBeNull()
  })

  it('editar valor vale só dali em diante; mês pago preserva snapshot (FR-105)', async () => {
    const rent = await createRent(userA)
    await payFixedExpense(db, userA, { id: rent.id, month: '2026-07' })
    await updateFixedExpense(db, userA, { id: rent.id, amount: 1980 })

    const july = await listFixedExpenses(db, userA, '2026-07')
    expect(july.items[0]?.payment?.amount).toBe('1850.00')
    expect(july.totals.paid).toBe(1850)

    const august = await listFixedExpenses(db, userA, '2026-08')
    expect(august.items[0]?.payment).toBeNull()
    expect(august.totals.pending).toBe(1980)
  })

  it('status derivado por mês: pago / pendente (mês futuro nunca vencido)', async () => {
    const rent = await createRent(userA)
    await payFixedExpense(db, userA, { id: rent.id, month: '2026-07' })

    const july = await listFixedExpenses(db, userA, '2026-07')
    expect(july.items[0]?.monthlyStatus).toBe('pago')

    const nextYear = await listFixedExpenses(db, userA, '2027-01')
    expect(nextYear.items[0]?.monthlyStatus).toBe('pendente')
  })
})

describe('fixed expenses — isolamento por usuário', () => {
  it('A não paga gasto fixo de B', async () => {
    const rentB = await createRent(userB)
    const result = await payFixedExpense(db, userA, { id: rentB.id, month: '2026-07' })
    expect(result).toBeNull()

    const listB = await listFixedExpenses(db, userB, '2026-07')
    expect(listB.items[0]?.payment).toBeNull()
  })

  it('A não vê gastos fixos de B', async () => {
    await createRent(userB)
    const listA = await listFixedExpenses(db, userA, '2026-07')
    expect(listA.items).toHaveLength(0)
  })
})
