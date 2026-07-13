import { useState } from 'react'
import { Text } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input } from '@/components/ui'
import { signUp } from '@/lib/auth-client'

export default function SignupScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setError(null)
    if (password.length < 8) {
      setError('A senha precisa ter ao menos 8 caracteres')
      return
    }
    setLoading(true)
    try {
      const { error: err } = await signUp.email({ name, email, password })
      if (err) {
        setError('Não foi possível criar a conta')
        return
      }
      router.replace('/(tabs)/inicio')
    } catch {
      setError('Não foi possível conectar ao servidor. Verifique a conexão e tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 justify-center bg-background px-6 dark:bg-background-dark">
      <Text className="mb-6 text-2xl font-black text-foreground dark:text-foreground-dark">
        Criar conta
      </Text>
      <Input label="Nome" value={name} onChangeText={setName} />
      <Input
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label="Senha (mínimo 8 caracteres)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? (
        <Text className="mb-3 text-xs font-bold text-negative dark:text-negative-dark">
          {error}
        </Text>
      ) : null}
      <Button
        title={loading ? 'Criando…' : 'Criar conta'}
        onPress={handleSignup}
        disabled={loading}
      />
      <Link
        href="/login"
        className="mt-4 text-center text-xs text-info dark:text-info-dark"
      >
        Já tenho conta — entrar
      </Link>
    </SafeAreaView>
  )
}
