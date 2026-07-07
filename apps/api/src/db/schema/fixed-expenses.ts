import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  date,
  timestamp,
  check,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'
import { categories } from './categories'
import { transactions } from './transactions'
import { activeStatus } from './enums'

// Gastos fixos mensais (spec amendment 2026-07-06, FR-100..107)
export const fixedExpenses = pgTable(
  'fixed_expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    dueDay: integer('due_day').notNull(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    status: activeStatus('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('fe_amount_positive', sql`${t.amount} > 0`),
    check('fe_due_day_range', sql`${t.dueDay} >= 1 and ${t.dueDay} <= 31`),
  ],
)

// Pagamento do mês: snapshot do valor na época (FR-105); um por mês (FR-103)
export const fixedExpensePayments = pgTable(
  'fixed_expense_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fixedExpenseId: uuid('fixed_expense_id')
      .notNull()
      .references(() => fixedExpenses.id, { onDelete: 'cascade' }),
    referenceMonth: date('reference_month').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    paidAt: date('paid_at').notNull(),
    transactionId: uuid('transaction_id').references(() => transactions.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('fep_expense_month_unique').on(t.fixedExpenseId, t.referenceMonth)],
)
