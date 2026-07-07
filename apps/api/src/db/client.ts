import pg from 'pg'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

// Driver pg padrão: funciona com Postgres local (Docker) e Neon (sslmode=require na URL).
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

export const db = drizzle(pool, { schema })
export type DrizzleDB = NodePgDatabase<typeof schema>
