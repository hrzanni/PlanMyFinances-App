import { createAuthClient } from 'better-auth/react'
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
  ],
})

export const { useSession, signIn, signUp, signOut } = authClient
