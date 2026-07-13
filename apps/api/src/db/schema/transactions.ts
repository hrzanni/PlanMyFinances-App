import { pgTable, uuid, text, numeric, date, timestamp, check, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'
import { categories, subcategories } from './categories'
import { folders } from './folders'
import { txType, txSource } from './enums'

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: txType('type').notNull(),
    value: numeric('value', { precision: 12, scale: 2 }).notNull(),
    description: text('description'),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    subcategoryId: uuid('subcategory_id').references(() => subcategories.id, {
      onDelete: 'set null',
    }),
    folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
    source: txSource('source').notNull().default('manual'),
    externalId: text('external_id'),
    date: date('date').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('tx_value_positive', sql`${t.value} > 0`),
    uniqueIndex('tx_user_external_unique')
      .on(t.userId, t.externalId)
      .where(sql`${t.externalId} is not null`),
  ],
)
