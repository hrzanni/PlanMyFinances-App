import { pgTable, uuid, text, date, timestamp } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { connectionStatus } from './enums'

// Conexões Open Finance via Meu Pluggy (spec amendment 2026-07-06, FR-120..125)
export const bankConnections = pgTable('bank_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  pluggyItemId: text('pluggy_item_id').notNull(),
  institutionName: text('institution_name').notNull(),
  status: connectionStatus('status').notNull().default('connected'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  consentExpiresAt: date('consent_expires_at'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
