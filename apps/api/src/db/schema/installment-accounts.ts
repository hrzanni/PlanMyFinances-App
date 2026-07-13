import { pgTable, uuid, text, numeric, integer, date, timestamp, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'
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

// Faturas: valores a pagar de cartão (FR-030..032)
export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cardName: text('card_name').notNull(),
    description: text('description'),
    amountPerInstallment: numeric('amount_per_installment', { precision: 12, scale: 2 }).notNull(),
    totalInstallments: integer('total_installments').notNull(),
    amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).notNull().default('0'),
    dueDate: date('due_date'),
    status: invoiceStatus('status').notNull().default('pendente'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      'invoice_paid_le_total',
      sql`${t.amountPaid} <= ${t.amountPerInstallment} * ${t.totalInstallments}`,
    ),
    check('invoice_installments_min', sql`${t.totalInstallments} >= 1`),
  ],
)
