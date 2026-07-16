import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, seedTestUsers } from '../test/test-db'
import type { DrizzleDB } from '../db/client'
import {
  createFixedExpense,
  deleteFixedExpense,
  endFixedExpense,
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
    type: 'despesa',
    amount: 1850,
    dueDay: 5,
  })
  return expense!
}

async function createSalary(userId: string, amount = 5000) {
  const expense = await createFixedExpense(db, userId, {
    name: 'Salário',
    type: 'receita',
    amount,
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

  it('editar valor (reajuste) vale a partir do mês escolhido; mês pago preserva snapshot (FR-105)', async () => {
    const rent = await createRent(userA)
    await payFixedExpense(db, userA, { id: rent.id, month: '2026-07' })
    await updateFixedExpense(db, userA, { id: rent.id, amount: 1980, amountEffectiveFrom: '2026-08' })

    const july = await listFixedExpenses(db, userA, '2026-07')
    expect(july.items[0]?.payment?.amount).toBe('1850.00')
    expect(july.totals.expense.paid).toBe(1850)

    const august = await listFixedExpenses(db, userA, '2026-08')
    expect(august.items[0]?.payment).toBeNull()
    expect(august.totals.expense.pending).toBe(1980)
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

describe('fixed expenses — receita fixa', () => {
  it('pagar receita fixa cria transação do tipo receita', async () => {
    const salary = await createSalary(userA)
    const payment = await payFixedExpense(db, userA, { id: salary.id, month: '2026-07' })

    expect(payment?.amount).toBe('5000.00')

    const { items } = await listTransactions(db, userA, { limit: 10 })
    expect(items).toHaveLength(1)
    expect(items[0]?.type).toBe('receita')
    expect(items[0]?.description).toBe('Salário')
  })

  it('totals separa despesa e receita sem misturar somas', async () => {
    const rent = await createRent(userA)
    const salary = await createSalary(userA)
    await payFixedExpense(db, userA, { id: rent.id, month: '2026-07' })

    const july = await listFixedExpenses(db, userA, '2026-07')

    expect(july.totals.expense.paid).toBe(1850)
    expect(july.totals.expense.pending).toBe(0)
    expect(july.totals.income.paid).toBe(0)
    expect(july.totals.income.pending).toBe(5000)

    await payFixedExpense(db, userA, { id: salary.id, month: '2026-07' })
    const julyAfter = await listFixedExpenses(db, userA, '2026-07')

    expect(julyAfter.totals.expense.paid).toBe(1850)
    expect(julyAfter.totals.income.paid).toBe(5000)
    expect(julyAfter.totals.expense.total).toBe(1850)
    expect(julyAfter.totals.income.total).toBe(5000)
  })
})

describe('fixed expenses — vigência (criação nunca é retroativa)', () => {
  it('fixo criado agora não aparece em mês anterior à criação', async () => {
    const rent = await createRent(userA)
    const june = await listFixedExpenses(db, userA, '2026-06')
    expect(june.items).toHaveLength(0)

    const july = await listFixedExpenses(db, userA, '2026-07')
    expect(july.items.map((i) => i.id)).toContain(rent.id)
  })
})

describe('fixed expenses — reajuste de valor (coerência entre meses)', () => {
  it('mudança de valor sem informar amountEffectiveFrom é rejeitada', async () => {
    const rent = await createRent(userA)
    const result = await updateFixedExpense(db, userA, { id: rent.id, amount: 1980 })
    expect(result).toBe('amount_effective_from_required')
  })

  it('amountEffectiveFrom igual ou anterior ao último valor registrado é rejeitado', async () => {
    const rent = await createRent(userA)
    const result = await updateFixedExpense(db, userA, {
      id: rent.id,
      amount: 1900,
      amountEffectiveFrom: '2026-07',
    })
    expect(result).toBe('invalid_amount_effective_from')
  })

  it('reajuste futuro mantém o valor antigo nos meses intermediários, mesmo não pagos', async () => {
    const rent = await createRent(userA)
    await updateFixedExpense(db, userA, {
      id: rent.id,
      amount: 1980,
      amountEffectiveFrom: '2026-09',
    })

    const august = await listFixedExpenses(db, userA, '2026-08')
    expect(august.items[0]?.amount).toBe('1850.00')

    const september = await listFixedExpenses(db, userA, '2026-09')
    expect(september.items[0]?.amount).toBe('1980.00')
  })
})

describe('fixed expenses — encerrar vs excluir definitivamente', () => {
  it('encerrar preserva meses passados/pagos e some dos meses futuros', async () => {
    const rent = await createRent(userA)
    await payFixedExpense(db, userA, { id: rent.id, month: '2026-07' })
    await endFixedExpense(db, userA, rent.id, '2026-07')

    const july = await listFixedExpenses(db, userA, '2026-07')
    expect(july.items[0]?.payment?.amount).toBe('1850.00')

    const august = await listFixedExpenses(db, userA, '2026-08')
    expect(august.items).toHaveLength(0)

    const { items } = await listTransactions(db, userA, { limit: 10 })
    expect(items).toHaveLength(1)
  })

  it('excluir definitivamente remove o fixo e o histórico junto', async () => {
    const rent = await createRent(userA)
    const result = await deleteFixedExpense(db, userA, rent.id)
    expect(result?.id).toBe(rent.id)

    const july = await listFixedExpenses(db, userA, '2026-07')
    expect(july.items).toHaveLength(0)
  })
})
