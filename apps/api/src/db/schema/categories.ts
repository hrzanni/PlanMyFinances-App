import { pgTable, uuid, text, boolean, index } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { txType } from './enums'

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: txType('type').notNull(),
    // Categorias criadas pelo sistema (ex.: "Cobrança") não são editáveis/apagáveis pelo usuário
    isSystem: boolean('is_system').notNull().default(false),
  },
  (t) => [index('categories_user_idx').on(t.userId)],
)

export const subcategories = pgTable(
  'subcategories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
  },
  (t) => [
    index('subcategories_user_idx').on(t.userId),
    index('subcategories_category_idx').on(t.categoryId),
  ],
)
