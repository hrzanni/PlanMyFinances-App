import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer } from 'better-auth/plugins'
import { db } from '../db/client'
import * as schema from '../db/schema'
import { sendResetPasswordEmail } from './email'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3333',
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.WEB_ORIGIN ?? 'http://localhost:3000'],
  database: drizzleAdapter(db, {
    provider: 'pg',
    // com usePlural o adapter procura as chaves "users", "sessions", "accounts", "verifications"
    schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({ to: user.email, url })
    },
  },
  // bearer: permite ao mobile autenticar com o token de sessão em Authorization (FR-063)
  plugins: [bearer()],
})

export type Auth = typeof auth
