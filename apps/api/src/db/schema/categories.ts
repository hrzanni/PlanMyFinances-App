import { pgTable, uuid, text, boolean } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { txType } from './enums'

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: txType('type').notNull(),
  // Categorias criadas pelo sistema (ex.: "Cobrança") não são editáveis/apagáveis pelo usuário
  isSystem: boolean('is_system').notNull().default(false),
})

export const subcategories = pgTable('subcategories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
})
