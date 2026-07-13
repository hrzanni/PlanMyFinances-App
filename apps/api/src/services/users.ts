import { eq } from 'drizzle-orm'
import type { DrizzleDB } from '../db/client'
import { users } from '../db/schema'

const publicColumns = { id: users.id, name: users.name, email: users.email }

export async function getUser(db: DrizzleDB, userId: string) {
  const [row] = await db.select(publicColumns).from(users).where(eq(users.id, userId))
  return row ?? null
}

export async function updateUserName(db: DrizzleDB, userId: string, name: string) {
  const [row] = await db
    .update(users)
    .set({ name, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning(publicColumns)
  return row ?? null
}
