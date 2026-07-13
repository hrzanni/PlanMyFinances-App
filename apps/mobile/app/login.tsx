import { useState } from 'react'
import { Text, View } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input } from '@/components/ui'
import { signIn } from '@/lib/auth-client'
import { isDevBypassEnabled } from '@/lib/dev-mode'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await signIn.email({ email, password })
      if (err) {
        setError('Email ou senha inválidos')
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
      <Text className="text-2xl font-black text-foreground dark:text-foreground-dark">
        Plan<Text className="font-light text-muted dark:text-muted-dark">My</Text>Finances
      </Text>
      <Text className="mb-6 mt-1 text-xs text-muted dark:text-muted-dark">
        Entre para continuar
      </Text>
      <Input
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input label="Senha" secureTextEntry value={password} onChangeText={setPassword} />
      {error ? (
        <Text className="mb-3 text-xs font-bold text-negative dark:text-negative-dark">
          {error}
        </Text>
      ) : null}
      <Button title={loading ? 'Entrando…' : 'Entrar'} onPress={handleLogin} disabled={loading} />
      {isDevBypassEnabled ? (
        <View className="mt-2">
          <Button
            title="Entrar em modo dev"
            variant="ghost"
            onPress={() => router.replace('/(tabs)/inicio')}
          />
        </View>
      ) : null}
      <View className="mt-4 flex-row justify-between">
        <Link href="/esqueci-senha" className="text-xs text-info dark:text-info-dark">
          Esqueci minha senha
        </Link>
        <Link href="/cadastro" className="text-xs text-info dark:text-info-dark">
          Criar conta
        </Link>
      </View>
    </SafeAreaView>
  )
}
