import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { expoClient } from '@better-auth/expo/client'
import * as SecureStore from 'expo-secure-store'
import { apiUrl } from './api'

/** Auth mobile: token de sessão guardado no SecureStore (FR-063). */
export const authClient = createAuthClient({
  baseURL: apiUrl(),
  plugins: [
    expoClient({
      scheme: 'planmyfinances',
      storagePrefix: 'pmf',
      storage: SecureStore,
    }),
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
