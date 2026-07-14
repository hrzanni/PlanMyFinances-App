import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { apiUrl } from './trpc'

export const authClient = createAuthClient({
  baseURL: apiUrl(),
  plugins: [
    // espelha os additionalFields do servidor (apps/api/src/auth/auth.ts)
    inferAdditionalFields({
      user: {
        birthDate: { type: 'string', required: false },
        gender: { type: 'string', required: false },
        phone: { type: 'string', required: false },
      },
    }),
  ],
})

export const { useSession, signIn, signUp, signOut } = authClient
