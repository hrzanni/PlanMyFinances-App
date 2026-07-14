import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { bankPreset } from './enums'

// Cartões: entidade própria (fase 8.2); faturas e transações apontam para cá
export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  bankPreset: bankPreset('bank_preset').notNull().default('outro'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
