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
import { activeStatus, txType } from './enums'

// Gastos fixos mensais (spec amendment 2026-07-06, FR-100..107)
export const fixedExpenses = pgTable(
  'fixed_expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: txType('type').notNull().default('despesa'),
    dueDay: integer('due_day').notNull(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    status: activeStatus('status').notNull().default('active'),
    // Mês (dia 01) em que o fixo passa a existir; nunca antes disso (2026-07-16).
    effectiveFrom: date('effective_from').notNull(),
    // Último mês (dia 01) em que o fixo ainda deve aparecer; null = ainda ativo.
    effectiveUntil: date('effective_until'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check('fe_due_day_range', sql`${t.dueDay} >= 1 and ${t.dueDay} <= 31`)],
)

// Histórico de valor do fixo (reajuste, 2026-07-16): cada linha vale a partir de
// effective_from até a próxima linha (ou até hoje); substitui a antiga coluna
// fixed_expenses.amount para nunca reescrever meses já passados.
export const fixedExpenseAmountHistory = pgTable(
  'fixed_expense_amount_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fixedExpenseId: uuid('fixed_expense_id')
      .notNull()
      .references(() => fixedExpenses.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    effectiveFrom: date('effective_from').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('feah_amount_positive', sql`${t.amount} > 0`),
    uniqueIndex('feah_expense_month_unique').on(t.fixedExpenseId, t.effectiveFrom),
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
