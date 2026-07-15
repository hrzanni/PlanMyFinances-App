import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  date,
  timestamp,
  check,
  unique,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'
import { cards } from './cards'
import { transactions } from './transactions'
import { categories } from './categories'
import { chargeStatus, invoiceStatus } from './enums'

// Cobranças: valores a receber de terceiros (FR-020..024)
export const charges = pgTable(
  'charges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    debtorName: text('debtor_name').notNull(),
    description: text('description'),
    amountPerInstallment: numeric('amount_per_installment', { precision: 12, scale: 2 }).notNull(),
    totalInstallments: integer('total_installments').notNull(),
    amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).notNull().default('0'),
    dueDate: date('due_date'),
    status: chargeStatus('status').notNull().default('pendente'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      'charge_paid_le_total',
      sql`${t.amountPaid} <= ${t.amountPerInstallment} * ${t.totalInstallments}`,
    ),
    check('charge_installments_min', sql`${t.totalInstallments} >= 1`),
  ],
)

// Recebimento parcial de cobrança: histórico + FK para a receita gerada (fase 8.1),
// espelhando fixed_expense_payments
export const chargePayments = pgTable('charge_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  chargeId: uuid('charge_id')
    .notNull()
    .references(() => charges.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  transactionId: uuid('transaction_id').references(() => transactions.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Faturas: valores a pagar de cartão (FR-030..032)
export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cardName: text('card_name').notNull(),
    cardId: uuid('card_id')
      .notNull()
      .references(() => cards.id),
    description: text('description'),
    amountPerInstallment: numeric('amount_per_installment', { precision: 12, scale: 2 }).notNull(),
    totalInstallments: integer('total_installments').notNull(),
    amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).notNull().default('0'),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    firstDueDate: date('first_due_date').notNull(),
    status: invoiceStatus('status').notNull().default('pendente'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check('invoice_installments_min', sql`${t.totalInstallments} >= 1`)],
)

// Pagamento de parcela de fatura: 1 row por parcela paga + FK da despesa gerada (faturas v2),
// espelhando charge_payments
export const invoicePayments = pgTable(
  'invoice_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    installmentNumber: integer('installment_number').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    paidOn: date('paid_on').notNull(),
    transactionId: uuid('transaction_id').references(() => transactions.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('invoice_payment_installment_unique').on(t.invoiceId, t.installmentNumber),
    check('invoice_payment_installment_min', sql`${t.installmentNumber} >= 1`),
  ],
)
