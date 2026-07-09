import { useState } from 'react'
import { Text } from 'react-native'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input } from '@/components/ui'
import { authClient } from '@/lib/auth-client'

/** Destino do deep link do email de recuperação (espelha a página web). */
export default function ResetPasswordScreen() {
  const router = useRouter()
  const { token } = useLocalSearchParams<{ token?: string }>()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    setError(null)
    if (!token) return setError('Link inválido ou expirado. Solicite um novo.')
    if (password.length < 8) return setError('A senha precisa de pelo menos 8 caracteres')
    setLoading(true)
    try {
      const { error: err } = await authClient.resetPassword({ newPassword: password, token })
      if (err) {
        setError('Link inválido ou expirado. Solicite um novo.')
        return
      }
      router.replace('/login')
    } catch {
      setError('Não foi possível redefinir. Verifique a conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 justify-center bg-background px-6 dark:bg-background-dark">
      <Text className="mb-6 text-2xl font-black text-foreground dark:text-foreground-dark">
        Defina sua nova senha
      </Text>
      <Input
        label="Nova senha (mínimo 8 caracteres)"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
      />
      {error ? (
        <Text className="mb-2 text-xs font-bold text-negative dark:text-negative-dark">
          {error}
        </Text>
      ) : null}
      <Button
        title={loading ? 'Salvando…' : 'Redefinir senha'}
        onPress={handleReset}
        disabled={loading}
      />
      <Link href="/login" className="mt-4 text-center text-xs text-info dark:text-info-dark">
        Voltar para o login
      </Link>
    </SafeAreaView>
  )
}
