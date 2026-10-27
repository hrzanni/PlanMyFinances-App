import {
  pgTable,
  uuid,
  text,
  numeric,
  date,
  timestamp,
  check,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './auth'
import { cards } from './cards'
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
    cardId: uuid('card_id').references(() => cards.id, { onDelete: 'set null' }),
    source: txSource('source').notNull().default('manual'),
    externalId: text('external_id'),
    date: date('date').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Listagens e dashboard filtram por usuário + intervalo de data. As FKs opcionais são
    // indexadas pelos filtros e para o ON DELETE SET NULL não varrer a tabela inteira.
    index('tx_user_date_idx').on(t.userId, t.date),
    index('tx_card_idx').on(t.cardId),
    index('tx_category_idx').on(t.categoryId),
    index('tx_subcategory_idx').on(t.subcategoryId),
    index('tx_folder_idx').on(t.folderId),
    check('tx_value_positive', sql`${t.value} > 0`),
    uniqueIndex('tx_user_external_unique')
      .on(t.userId, t.externalId)
      .where(sql`${t.externalId} is not null`),
  ],
)
