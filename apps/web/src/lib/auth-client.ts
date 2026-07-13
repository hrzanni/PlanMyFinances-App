import { createAuthClient } from 'better-auth/react'
import { apiUrl } from './trpc'

export const authClient = createAuthClient({
  baseURL: apiUrl(),
})

export const { useSession, signIn, signUp, signOut } = authClient
