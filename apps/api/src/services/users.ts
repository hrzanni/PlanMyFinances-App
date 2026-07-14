import { eq } from 'drizzle-orm'
import type { DrizzleDB } from '../db/client'
import { users } from '../db/schema'

const publicColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  birthDate: users.birthDate,
  gender: users.gender,
  phone: users.phone,
}

export type UserProfilePatch = {
  name: string
  birthDate?: string | null
  gender?: string | null
  phone?: string | null
}

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

export async function updateUserProfile(db: DrizzleDB, userId: string, patch: UserProfilePatch) {
  const [row] = await db
    .update(users)
    .set({
      name: patch.name,
      // undefined = campo omitido, não sobrescreve; null = limpar
      ...(patch.birthDate !== undefined && { birthDate: patch.birthDate }),
      ...(patch.gender !== undefined && { gender: patch.gender }),
      ...(patch.phone !== undefined && { phone: patch.phone }),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning(publicColumns)
  return row ?? null
}
