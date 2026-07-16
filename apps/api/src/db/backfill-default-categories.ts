import 'dotenv/config'
import { db } from './client'
import { users } from './schema'
import { seedDefaultCategoriesForUser } from '../services/default-categories'

// Aplica retroativamente as categorias/subcategorias padrão a usuários já existentes.
// Idempotente: seguro rodar mais de uma vez, inclusive após o hook de cadastro entrar em produção.
async function main() {
  const allUsers = await db.select({ id: users.id }).from(users)

  for (const user of allUsers) {
    await seedDefaultCategoriesForUser(db, user.id)
  }

  console.log(`[backfill] categorias padrão aplicadas a ${allUsers.length} usuário(s)`)
  process.exit(0)
}

main().catch((err) => {
  console.error('[backfill] falha:', err)
  process.exit(1)
})
