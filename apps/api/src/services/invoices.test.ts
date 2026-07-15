import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, seedTestUsers } from '../test/test-db'
import type { DrizzleDB } from '../db/client'
import { categories, invoicePayments } from '../db/schema'
import { createInvoice, listInvoices, updateInvoice } from './invoices'
import { createCard } from './cards'

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

async function createTestCard(userId: string, name = 'Roxinho') {
  const row = await createCard(db, userId, { name, bankPreset: 'nubank' })
  return row!
}

describe('invoices — create/update (Faturas v2)', () => {
  it('cria fatura com categoria própria: row com firstDueDate e categoryId, cardName derivado do cartão', async () => {
    const category = await createCategory(userA)
    const card = await createTestCard(userA)
    const row = await createInvoice(db, userA, {
      cardId: card.id,
      amountPerInstallment: 100,
      totalInstallments: 3,
      firstDueDate: '2026-08-10',
      categoryId: category.id,
      status: 'pendente',
    })
    expect(row).toMatchObject({
      cardName: 'Roxinho',
      cardId: card.id,
      firstDueDate: '2026-08-10',
      categoryId: category.id,
      amountPaid: '0.00',
      status: 'pendente',
    })
  })

  it('categoria de outro usuário → category_not_found', async () => {
    const categoryB = await createCategory(userB)
    const card = await createTestCard(userA)
    const result = await createInvoice(db, userA, {
      cardId: card.id,
      amountPerInstallment: 100,
      totalInstallments: 3,
      firstDueDate: '2026-08-10',
      categoryId: categoryB.id,
      status: 'pendente',
    })
    expect(result).toBe('category_not_found')
  })

  it('cardId de outro usuário → card_not_found', async () => {
    const cardB = await createCard(db, userB, { name: 'De B', bankPreset: 'outro' })
    const result = await createInvoice(db, userA, {
      cardId: cardB!.id,
      amountPerInstallment: 100,
      totalInstallments: 1,
      firstDueDate: '2026-08-10',
      status: 'pendente',
    })
    expect(result).toBe('card_not_found')
  })

  it('cardId inexistente/ausente → card_not_found', async () => {
    const result = await createInvoice(db, userA, {
      cardId: '00000000-0000-0000-0000-000000000000',
      amountPerInstallment: 100,
      totalInstallments: 1,
      firstDueDate: '2026-08-10',
      status: 'pendente',
    })
    expect(result).toBe('card_not_found')
  })

  it('update troca categoria para null e redeeriva cardName ao trocar de cartão', async () => {
    const category = await createCategory(userA)
    const card = await createTestCard(userA, 'Roxinho')
    const created = await createInvoice(db, userA, {
      cardId: card.id,
      amountPerInstallment: 100,
      totalInstallments: 3,
      firstDueDate: '2026-08-10',
      categoryId: category.id,
      status: 'pendente',
    })
    const row = created as Exclude<typeof created, 'card_not_found' | 'category_not_found'>

    const otherCard = await createTestCard(userA, 'Laranja')
    const updated = await updateInvoice(db, userA, {
      id: row!.id,
      cardId: otherCard.id,
      amountPerInstallment: 100,
      totalInstallments: 3,
      firstDueDate: '2026-08-10',
      categoryId: null,
      status: 'pendente',
    })
    expect(updated).toMatchObject({ categoryId: null, cardId: otherCard.id, cardName: 'Laranja' })
  })
})

describe('invoices — list enriquecido', () => {
  it('traz categoryName e payments: [] quando não há pagamentos', async () => {
    const category = await createCategory(userA, 'Cartão de crédito')
    const card = await createTestCard(userA)
    await createInvoice(db, userA, {
      cardId: card.id,
      amountPerInstallment: 100,
      totalInstallments: 3,
      firstDueDate: '2026-08-10',
      categoryId: category.id,
      status: 'pendente',
    })

    const [row] = await listInvoices(db, userA)
    expect(row).toMatchObject({ categoryName: 'Cartão de crédito', payments: [] })
  })

  it('traz payments ordenados por installmentNumber quando existem rows em invoicePayments', async () => {
    const card = await createTestCard(userA)
    const created = await createInvoice(db, userA, {
      cardId: card.id,
      amountPerInstallment: 100,
      totalInstallments: 3,
      firstDueDate: '2026-08-10',
      status: 'pendente',
    })
    const row = created as Exclude<typeof created, 'card_not_found' | 'category_not_found'>

    await db.insert(invoicePayments).values([
      {
        userId: userA,
        invoiceId: row!.id,
        installmentNumber: 2,
        amount: '100.00',
        paidOn: '2026-09-10',
      },
      {
        userId: userA,
        invoiceId: row!.id,
        installmentNumber: 1,
        amount: '100.00',
        paidOn: '2026-08-10',
      },
    ])

    const [listed] = await listInvoices(db, userA)
    expect(listed?.payments.map((p) => p.installmentNumber)).toEqual([1, 2])
    expect(listed?.categoryName).toBeNull()
  })
})
