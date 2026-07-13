import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer } from 'better-auth/plugins'
import { expo } from '@better-auth/expo'
import { db } from '../db/client'
import * as schema from '../db/schema'
import { sendResetPasswordEmail } from './email'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3333',
  secret: process.env.BETTER_AUTH_SECRET,
  // web por cookie; mobile Expo pelo scheme do app (deep link)
  trustedOrigins: [process.env.WEB_ORIGIN ?? 'http://localhost:3005', 'planmyfinances://'],
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
  // bearer: mobile autentica com token de sessão em Authorization (FR-063); expo: deep links
  plugins: [bearer(), expo()],
  // Produção: web (vercel.app) e API (onrender.com) vivem em domínios distintos;
  // cookie cross-site exige SameSite=None + Secure. Local (http) mantém o padrão Lax.
  advanced:
    process.env.NODE_ENV === 'production'
      ? { defaultCookieAttributes: { sameSite: 'none', secure: true } }
      : undefined,
})

export type Auth = typeof auth
