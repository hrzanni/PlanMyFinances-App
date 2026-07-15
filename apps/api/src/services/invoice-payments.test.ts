import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, seedTestUsers } from '../test/test-db'
import type { DrizzleDB } from '../db/client'
import { categories } from '../db/schema'
import { createInvoice, listInvoices } from './invoices'
import { createCard } from './cards'
import { listTransactions } from './transactions'
import {
  registerInvoicePayment,
  unregisterInvoicePayment,
  updateInvoicePayment,
} from './invoice-payments'

let db: DrizzleDB
let userA: string
let userB: string

beforeEach(async () => {
  db = await createTestDb()
  const users = await seedTestUsers(db)
  userA = users.userA
  userB = users.userB
})

async function createCategory(userId: string, name = 'Cartão de crédito') {
  const [row] = await db
    .insert(categories)
    .values({ userId, name, type: 'despesa' })
    .returning()
  return row!
}

async function createTestInvoice(
  userId: string,
  overrides: { categoryId?: string; cardId?: string; totalInstallments?: number } = {},
) {
  const cardId =
    overrides.cardId ??
    (await createCard(db, userId, { name: 'Roxinho', bankPreset: 'nubank' }))!.id
  const created = await createInvoice(db, userId, {
    cardId,
    amountPerInstallment: 100,
    totalInstallments: overrides.totalInstallments ?? 3,
    firstDueDate: '2026-08-10',
    categoryId: overrides.categoryId,
    status: 'pendente',
  })
  return created as Exclude<typeof created, 'card_not_found' | 'category_not_found'>
}

type RegisterResult = Awaited<ReturnType<typeof registerInvoicePayment>>
type Registered = Exclude<RegisterResult, null | 'invalid_installment' | 'conflict'>

function registeredOrFail(
  result: Registered | null | 'invalid_installment' | 'conflict' | undefined,
): Registered {
  expect(result).not.toBeNull()
  expect(result).not.toBe('invalid_installment')
  expect(result).not.toBe('conflict')
  return result as Registered
}

describe('invoice payments — registrar pagamento de parcela (Faturas v2)', () => {
  it('cria despesa com categoria/cartão/source corretos e soma ao amountPaid', async () => {
    const category = await createCategory(userA)
    const card = await createCard(db, userA, { name: 'Roxinho', bankPreset: 'nubank' })
    const invoice = await createTestInvoice(userA, { categoryId: category.id, cardId: card!.id })

    const result = registeredOrFail(
      await registerInvoicePayment(db, userA, {
        id: invoice!.id,
        installmentNumber: 1,
        amount: 100,
        paidOn: '2026-08-10',
      }),
    )
    expect(result.payment).toMatchObject({
      invoiceId: invoice!.id,
      installmentNumber: 1,
      amount: '100.00',
      paidOn: '2026-08-10',
      transactionId: result.transaction.id,
    })
    expect(result.transaction).toMatchObject({
      type: 'despesa',
      value: '100.00',
      description: 'Roxinho — parcela 1/3',
      categoryId: category.id,
      cardId: card!.id,
      source: 'invoice',
      date: '2026-08-10',
    })

    const { items } = await listTransactions(db, userA, { limit: 10 })
    expect(items).toHaveLength(1)

    const [listed] = await listInvoices(db, userA)
    expect(listed?.amountPaid).toBe('100.00')
    expect(listed?.status).toBe('pendente')
  })

  it('usa o cardName como fallback de descrição quando a fatura não tem description', async () => {
    const invoice = await createTestInvoice(userA)
    const result = registeredOrFail(
      await registerInvoicePayment(db, userA, {
        id: invoice!.id,
        installmentNumber: 1,
        amount: 100,
        paidOn: '2026-08-10',
      }),
    )
    expect(result.transaction.description).toBe('Roxinho — parcela 1/3')
  })

  it('todas as parcelas pagas → status pago', async () => {
    const invoice = await createTestInvoice(userA, { totalInstallments: 2 })
    await registerInvoicePayment(db, userA, {
      id: invoice!.id,
      installmentNumber: 1,
      amount: 100,
      paidOn: '2026-08-10',
    })
    await registerInvoicePayment(db, userA, {
      id: invoice!.id,
      installmentNumber: 2,
      amount: 100,
      paidOn: '2026-09-10',
    })

    const [listed] = await listInvoices(db, userA)
    expect(listed?.amountPaid).toBe('200.00')
    expect(listed?.status).toBe('pago')
  })

  it('pagamento fora de ordem (parcela 3 antes da 2) funciona', async () => {
    const invoice = await createTestInvoice(userA, { totalInstallments: 3 })
    const result = registeredOrFail(
      await registerInvoicePayment(db, userA, {
        id: invoice!.id,
        installmentNumber: 3,
        amount: 100,
        paidOn: '2026-10-10',
      }),
    )
    expect(result.payment.id).toBeTruthy()

    const [listed] = await listInvoices(db, userA)
    expect(listed?.amountPaid).toBe('100.00')
    expect(listed?.status).toBe('pendente')
  })

  it('parcela duplicada → conflict', async () => {
    const invoice = await createTestInvoice(userA)
    await registerInvoicePayment(db, userA, {
      id: invoice!.id,
      installmentNumber: 1,
      amount: 100,
      paidOn: '2026-08-10',
    })
    const result = await registerInvoicePayment(db, userA, {
      id: invoice!.id,
      installmentNumber: 1,
      amount: 100,
      paidOn: '2026-08-10',
    })
    expect(result).toBe('conflict')
  })

  it('installmentNumber fora da faixa → invalid_installment', async () => {
    const invoice = await createTestInvoice(userA, { totalInstallments: 3 })
    const result = await registerInvoicePayment(db, userA, {
      id: invoice!.id,
      installmentNumber: 4,
      amount: 100,
      paidOn: '2026-08-10',
    })
    expect(result).toBe('invalid_installment')
  })

  it('permite pagamento acima do valor nominal da parcela', async () => {
    const invoice = await createTestInvoice(userA, { totalInstallments: 1 })
    const result = registeredOrFail(
      await registerInvoicePayment(db, userA, {
        id: invoice!.id,
        installmentNumber: 1,
        amount: 150,
        paidOn: '2026-08-10',
      }),
    )
    expect(result.payment.amount).toBe('150.00')

    const [listed] = await listInvoices(db, userA)
    expect(listed?.amountPaid).toBe('150.00')
    expect(listed?.status).toBe('pago')
  })

  it('fatura de outro usuário → null', async () => {
    const invoiceB = await createTestInvoice(userB)
    const result = await registerInvoicePayment(db, userA, {
      id: invoiceB!.id,
      installmentNumber: 1,
      amount: 100,
      paidOn: '2026-08-10',
    })
    expect(result).toBeNull()
  })
})

describe('invoice payments — atualizar pagamento', () => {
  it('muda o valor do pagamento e da despesa vinculada', async () => {
    const invoice = await createTestInvoice(userA)
    const registered = registeredOrFail(
      await registerInvoicePayment(db, userA, {
        id: invoice!.id,
        installmentNumber: 1,
        amount: 100,
        paidOn: '2026-08-10',
      }),
    )

    const updated = await updateInvoicePayment(db, userA, {
      paymentId: registered.payment.id,
      amount: 150,
      paidOn: '2026-08-12',
    })
    expect(updated).toMatchObject({ amount: '150.00', paidOn: '2026-08-12' })

    const { items } = await listTransactions(db, userA, { limit: 10 })
    expect(items[0]).toMatchObject({ value: '150.00', date: '2026-08-12' })

    const [listed] = await listInvoices(db, userA)
    expect(listed?.amountPaid).toBe('150.00')
  })

  it('pagamento inexistente ou de outro usuário → null', async () => {
    const invoice = await createTestInvoice(userB)
    const registered = registeredOrFail(
      await registerInvoicePayment(db, userB, {
        id: invoice!.id,
        installmentNumber: 1,
        amount: 100,
        paidOn: '2026-08-10',
      }),
    )
    const result = await updateInvoicePayment(db, userA, {
      paymentId: registered.payment.id,
      amount: 150,
      paidOn: '2026-08-12',
    })
    expect(result).toBeNull()
  })
})

describe('invoice payments — desfazer pagamento', () => {
  it('apaga despesa vinculada, reverte agregados e status', async () => {
    const invoice = await createTestInvoice(userA, { totalInstallments: 1 })
    const registered = registeredOrFail(
      await registerInvoicePayment(db, userA, {
        id: invoice!.id,
        installmentNumber: 1,
        amount: 100,
        paidOn: '2026-08-10',
      }),
    )
    const [afterRegister] = await listInvoices(db, userA)
    expect(afterRegister?.status).toBe('pago')

    const result = await unregisterInvoicePayment(db, userA, { paymentId: registered.payment.id })
    expect(result).not.toBeNull()

    const { items } = await listTransactions(db, userA, { limit: 10 })
    expect(items).toHaveLength(0)

    const [listed] = await listInvoices(db, userA)
    expect(listed?.amountPaid).toBe('0.00')
    expect(listed?.status).toBe('pendente')
    expect(listed?.payments).toHaveLength(0)
  })

  it('pagamento de outro usuário → null', async () => {
    const invoice = await createTestInvoice(userB)
    const registered = registeredOrFail(
      await registerInvoicePayment(db, userB, {
        id: invoice!.id,
        installmentNumber: 1,
        amount: 100,
        paidOn: '2026-08-10',
      }),
    )
    const result = await unregisterInvoicePayment(db, userA, { paymentId: registered.payment.id })
    expect(result).toBeNull()
  })
})
