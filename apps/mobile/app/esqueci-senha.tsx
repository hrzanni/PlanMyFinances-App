import { useState } from 'react'
import { Text } from 'react-native'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input } from '@/components/ui'
import { authClient } from '@/lib/auth-client'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    setLoading(true)
    await authClient.requestPasswordReset({ email, redirectTo: '/redefinir-senha' })
    setLoading(false)
    setSent(true)
  }

  return (
    <SafeAreaView className="flex-1 justify-center bg-background px-6 dark:bg-background-dark">
      <Text className="mb-6 text-2xl font-black text-foreground dark:text-foreground-dark">
        Recuperar senha
      </Text>
      {sent ? (
        <Text className="text-sm text-body dark:text-body-dark">
          Se existir uma conta com este email, você receberá um link para redefinir a senha.
        </Text>
      ) : (
        <>
          <Input
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Button
            title={loading ? 'Enviando…' : 'Enviar link'}
            onPress={handleSend}
            disabled={loading}
          />
        </>
      )}
      <Link href="/login" className="mt-4 text-center text-xs text-info dark:text-info-dark">
        Voltar para o login
      </Link>
    </SafeAreaView>
  )
}
