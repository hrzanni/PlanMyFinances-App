import { useState } from 'react'
import { ScrollView, Text } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { isAcceptablePassword } from '@pmf/core'
import { birthDateSchema, phoneSchema, type Gender } from '@pmf/schemas'
import { Button, Input } from '@/components/ui'
import { signUp } from '@/lib/auth-client'
import { GenderChips } from '@/components/gender-chips'
import { PasswordStrengthMeter } from '@/components/password-strength'

export default function SignupScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function validate(): string | null {
    if (!isAcceptablePassword(password))
      return 'Senha fraca: use ao menos 8 caracteres misturando letras, números ou símbolos'
    if (birthDate && !birthDateSchema.safeParse(birthDate).success)
      return 'Data de nascimento inválida (use AAAA-MM-DD)'
    if (phone && !phoneSchema.safeParse(phone).success) return 'Telefone inválido'
    return null
  }

  async function handleSignup() {
    setError(null)
    const validationError = validate()
    if (validationError) return setError(validationError)
    setLoading(true)
    try {
      const { error: err } = await signUp.email({
        name,
        email,
        password,
        ...(birthDate && { birthDate }),
        ...(gender && { gender }),
        ...(phone && { phone: phone.trim() }),
      })
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
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingVertical: 24 }}
        keyboardShouldPersistTaps="handled"
      >
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
          label="Data de nascimento (opcional, AAAA-MM-DD)"
          placeholder="1990-05-20"
          keyboardType="numbers-and-punctuation"
          value={birthDate}
          onChangeText={setBirthDate}
        />
        <GenderChips value={gender} onChange={setGender} />
        <Input
          label="Telefone (opcional)"
          placeholder="+55 11 91234-5678"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <Input label="Senha" secureTextEntry value={password} onChangeText={setPassword} />
        <PasswordStrengthMeter password={password} />
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
      </ScrollView>
    </SafeAreaView>
  )
}
