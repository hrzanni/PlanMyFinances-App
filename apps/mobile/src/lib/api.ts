import Constants from 'expo-constants'

/**
 * URL da API. Em dev, deriva o IP do host do Metro (o emulador/celular não enxerga
 * "localhost" da máquina). Sobrescreva com EXPO_PUBLIC_API_URL quando necessário.
 */
export function apiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL
  if (fromEnv) return fromEnv
  const hostUri = Constants.expoConfig?.hostUri
  const host = hostUri?.split(':')[0]
  return host ? `http://${host}:3333` : 'http://localhost:3333'
}
