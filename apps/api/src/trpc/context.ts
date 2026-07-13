import type { FastifyRequest } from 'fastify'
import { db, type DrizzleDB } from '../db/client'
import { auth } from '../auth/auth'
import { DEV_USER_ID, isDevBypassEnabled } from '../auth/dev-mode'

export interface Context {
  userId: string | null
  db: DrizzleDB
}

function toHeaders(req: FastifyRequest): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value)
    else if (Array.isArray(value)) headers.set(key, value.join(', '))
  }
  return headers
}

/** Resolve a identidade (cookie web ou bearer mobile) via Better Auth (FR-064). */
export async function createContext({ req }: { req: FastifyRequest }): Promise<Context> {
  if (isDevBypassEnabled()) {
    return { userId: DEV_USER_ID, db }
  }
  const session = await auth.api.getSession({ headers: toHeaders(req) })
  return { userId: session?.user.id ?? null, db }
}
