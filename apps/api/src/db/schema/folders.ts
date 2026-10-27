import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { activeStatus } from './enums'

export const folders = pgTable(
  'folders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    status: activeStatus('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('folders_user_idx').on(t.userId)],
)
