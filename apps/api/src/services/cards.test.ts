import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, seedTestUsers } from '../test/test-db'
import type { DrizzleDB } from '../db/client'
import { createCard, deleteCard, listCards, updateCard } from './cards'
import { createTransaction, listTransactions } from './transactions'
import { createInvoice, listInvoices } from './invoices'

let db: DrizzleDB
let userA: string
let userB: string

beforeEach(async () => {
  db = await createTestDb()
  const users = await seedTestUsers(db)
  userA = users.userA
  userB = users.userB
})

describe('cards — CRUD (fase 8.2)', () => {
  it('cria com preset e lista ordenado por nome', async () => {
    await createCard(db, userA, { name: 'Roxinho', bankPreset: 'nubank' })
    await createCard(db, userA, { name: 'Laranja', bankPreset: 'inter' })

    const list = await listCards(db, userA)
    expect(list.map((c) => c.name)).toEqual(['Laranja', 'Roxinho'])
    expect(list[1]?.bankPreset).toBe('nubank')
  })

  it('atualiza nome e preset', async () => {
    const card = await createCard(db, userA, { name: 'Cartão', bankPreset: 'outro' })
    const updated = await updateCard(db, userA, {
      id: card!.id,
      name: 'BB Ourocard',
      bankPreset: 'banco_do_brasil',
    })
    expect(updated).toMatchObject({ name: 'BB Ourocard', bankPreset: 'banco_do_brasil' })
  })

  it('conta transações vinculadas (uso por cartão)', async () => {
    const card = await createCard(db, userA, { name: 'Roxinho', bankPreset: 'nubank' })
    await createTransaction(db, userA, {
      type: 'despesa',
      value: 50,
      date: '2026-07-10',
      cardId: card!.id,
    })
    await createTransaction(db, userA, {
      type: 'receita',
      value: 20,
      date: '2026-07-11',
      cardId: card!.id,
    })
    await createTransaction(db, userA, { type: 'despesa', value: 10, date: '2026-07-12' })

    const [row] = await listCards(db, userA)
    expect(row?.txCount).toBe(2)
  })

  it('excluir cartão desvincula transações e faturas sem apagá-las (SET NULL)', async () => {
    const card = await createCard(db, userA, { name: 'Roxinho', bankPreset: 'nubank' })
    await createTransaction(db, userA, {
      type: 'despesa',
      value: 50,
      date: '2026-07-10',
      cardId: card!.id,
    })
    await createInvoice(db, userA, {
      cardName: 'Roxinho',
      cardId: card!.id,
      amountPerInstallment: 100,
      totalInstallments: 2,
      firstDueDate: '2026-08-10',
      status: 'pendente',
    })

    await deleteCard(db, userA, card!.id)

    const { items } = await listTransactions(db, userA, { limit: 10 })
    expect(items).toHaveLength(1)
    expect(items[0]?.cardId).toBeNull()
    const invoicesList = await listInvoices(db, userA)
    expect(invoicesList).toHaveLength(1)
    expect(invoicesList[0]?.cardId).toBeNull()
  })
})

describe('cards — isolamento por usuário', () => {
  it('A não vê nem edita cartões de B', async () => {
    const cardB = await createCard(db, userB, { name: 'De B', bankPreset: 'outro' })
    expect(await listCards(db, userA)).toHaveLength(0)
    expect(
      await updateCard(db, userA, { id: cardB!.id, name: 'Roubado', bankPreset: 'outro' }),
    ).toBeNull()
    expect(await deleteCard(db, userA, cardB!.id)).toBeNull()
  })

  it('A não vincula transação nem fatura a cartão de B', async () => {
    const cardB = await createCard(db, userB, { name: 'De B', bankPreset: 'outro' })
    expect(
      await createTransaction(db, userA, {
        type: 'despesa',
        value: 50,
        date: '2026-07-10',
        cardId: cardB!.id,
      }),
    ).toBeNull()
    expect(
      await createInvoice(db, userA, {
        cardName: 'De B',
        cardId: cardB!.id,
        amountPerInstallment: 100,
        totalInstallments: 1,
        firstDueDate: '2026-08-10',
        status: 'pendente',
      }),
    ).toBe('card_not_found')
  })
})
