import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, seedTestUsers } from '../test/test-db'
import type { DrizzleDB } from '../db/client'
import { createCharge, listCharges } from './charges'
import {
  CHARGE_CATEGORY_NAME,
  listChargePayments,
  registerChargePayment,
  unregisterChargePayment,
} from './charge-payments'
import { deleteCategory, listCategories, updateCategory } from './categories'
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

async function createLoan(userId: string) {
  const charge = await createCharge(db, userId, {
    debtorName: 'João',
    amountPerInstallment: 100,
    totalInstallments: 3,
    amountPaid: 0,
    status: 'pendente',
  })
  return charge!
}

type Payment = { id: string }

function paymentOrFail(result: Payment | 'exceeds_total' | null | undefined): Payment {
  expect(result).not.toBeNull()
  expect(result).not.toBe('exceeds_total')
  return result as Payment
}

describe('charge payments — registrar recebimento (fase 8.1)', () => {
  it('cria payment + receita na categoria de sistema e soma ao amountPaid', async () => {
    const loan = await createLoan(userA)
    const payment = paymentOrFail(
      await registerChargePayment(db, userA, { id: loan.id, amount: 150 }),
    )
    expect(payment).toMatchObject({ chargeId: loan.id, amount: '150.00' })

    const { items } = await listTransactions(db, userA, { limit: 10 })
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      type: 'receita',
      source: 'charge',
      value: '150.00',
      description: 'Recebimento de João',
    })

    const [charge] = await listCharges(db, userA)
    expect(charge?.amountPaid).toBe('150.00')
    expect(charge?.status).toBe('pendente')

    const cats = await listCategories(db, userA)
    expect(cats).toHaveLength(1)
    expect(cats[0]).toMatchObject({ name: CHARGE_CATEGORY_NAME, type: 'receita', isSystem: true })
  })

  it('reaproveita a categoria de sistema em recebimentos seguintes', async () => {
    const loan = await createLoan(userA)
    await registerChargePayment(db, userA, { id: loan.id, amount: 50 })
    await registerChargePayment(db, userA, { id: loan.id, amount: 50 })

    const cats = await listCategories(db, userA)
    expect(cats).toHaveLength(1)

    const payments = await listChargePayments(db, userA, loan.id)
    expect(payments).toHaveLength(2)
  })

  it('quitação total muda o status para pago', async () => {
    const loan = await createLoan(userA)
    await registerChargePayment(db, userA, { id: loan.id, amount: 300 })

    const [charge] = await listCharges(db, userA)
    expect(charge?.amountPaid).toBe('300.00')
    expect(charge?.status).toBe('pago')
  })

  it('recebimento acima do restante é rejeitado sem efeito colateral (RN-004)', async () => {
    const loan = await createLoan(userA)
    await registerChargePayment(db, userA, { id: loan.id, amount: 250 })
    const result = await registerChargePayment(db, userA, { id: loan.id, amount: 100 })
    expect(result).toBe('exceeds_total')

    const { items } = await listTransactions(db, userA, { limit: 10 })
    expect(items).toHaveLength(1)
    const [charge] = await listCharges(db, userA)
    expect(charge?.amountPaid).toBe('250.00')
  })
})

describe('charge payments — desfazer recebimento', () => {
  it('remove payment + receita e recompõe o amountPaid, nada fica órfão', async () => {
    const loan = await createLoan(userA)
    const payment = paymentOrFail(
      await registerChargePayment(db, userA, { id: loan.id, amount: 150 }),
    )
    const result = await unregisterChargePayment(db, userA, { paymentId: payment.id })
    expect(result).not.toBeNull()

    const { items } = await listTransactions(db, userA, { limit: 10 })
    expect(items).toHaveLength(0)
    expect(await listChargePayments(db, userA, loan.id)).toHaveLength(0)

    const [charge] = await listCharges(db, userA)
    expect(charge?.amountPaid).toBe('0.00')
  })

  it('desfazer quitação volta o status para pendente', async () => {
    const loan = await createLoan(userA)
    const payment = paymentOrFail(
      await registerChargePayment(db, userA, { id: loan.id, amount: 300 }),
    )
    await unregisterChargePayment(db, userA, { paymentId: payment.id })

    const [charge] = await listCharges(db, userA)
    expect(charge?.status).toBe('pendente')
    expect(charge?.amountPaid).toBe('0.00')
  })
})

describe('charge payments — isolamento por usuário', () => {
  it('A não registra recebimento em cobrança de B', async () => {
    const loanB = await createLoan(userB)
    const result = await registerChargePayment(db, userA, { id: loanB.id, amount: 100 })
    expect(result).toBeNull()
  })

  it('A não desfaz recebimento de B', async () => {
    const loanB = await createLoan(userB)
    const payment = paymentOrFail(
      await registerChargePayment(db, userB, { id: loanB.id, amount: 100 }),
    )
    const result = await unregisterChargePayment(db, userA, { paymentId: payment.id })
    expect(result).toBeNull()
  })
})

describe('categoria de sistema — não editável/apagável', () => {
  it('update e delete retornam forbidden', async () => {
    const loan = await createLoan(userA)
    await registerChargePayment(db, userA, { id: loan.id, amount: 100 })
    const [cat] = await listCategories(db, userA)

    expect(await updateCategory(db, userA, { id: cat!.id, name: 'Outra' })).toBe('forbidden')
    expect(await deleteCategory(db, userA, cat!.id)).toBe('forbidden')
  })
})
