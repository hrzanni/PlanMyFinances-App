import 'dotenv/config'
import { db } from './client'
import { users, categories } from './schema'
import { DEV_USER_ID } from '../auth/dev-mode'

// Provisiona o usuário dev do modo AUTH_BYPASS (FR-080) e categorias iniciais.
async function main() {
  await db
    .insert(users)
    .values({
      id: DEV_USER_ID,
      name: 'Dev',
      email: 'dev@planmyfinances.local',
      emailVerified: true,
    })
    .onConflictDoNothing()

  const defaults: Array<{ name: string; type: 'receita' | 'despesa' }> = [
    { name: 'Moradia', type: 'despesa' },
    { name: 'Alimentação', type: 'despesa' },
    { name: 'Transporte', type: 'despesa' },
    { name: 'Saúde', type: 'despesa' },
    { name: 'Assinaturas', type: 'despesa' },
    { name: 'Renda', type: 'receita' },
  ]
  for (const cat of defaults) {
    await db
      .insert(categories)
      .values({ userId: DEV_USER_ID, ...cat })
      .onConflictDoNothing()
  }

  console.log('[seed] usuário dev e categorias iniciais provisionados')
  process.exit(0)
}

main().catch((err) => {
  console.error('[seed] falha:', err)
  process.exit(1)
})
