import { Text, View } from 'react-native'
import { passwordStrength, type PasswordStrength } from '@pmf/core'

const LEVELS: Record<PasswordStrength, { label: string; bars: number; bar: string; text: string }> = {
  fraca: {
    label: 'Senha fraca',
    bars: 1,
    bar: 'bg-negative dark:bg-negative-dark',
    text: 'text-negative dark:text-negative-dark',
  },
  moderada: {
    label: 'Senha moderada',
    bars: 2,
    bar: 'bg-attention dark:bg-attention-dark',
    text: 'text-attention dark:text-attention-dark',
  },
  forte: {
    label: 'Senha forte',
    bars: 3,
    bar: 'bg-positive dark:bg-positive-dark',
    text: 'text-positive dark:text-positive-dark',
  },
}

/** Medidor visual de força de senha (fraca/moderada/forte) para formulários de auth. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null
  const level = LEVELS[passwordStrength(password)]
  return (
    <View className="mb-3">
      <View className="flex-row gap-1">
        {[1, 2, 3].map((bar) => (
          <View
            key={bar}
            className={`h-1 flex-1 rounded-full ${
              bar <= level.bars ? level.bar : 'bg-line dark:bg-line-dark'
            }`}
          />
        ))}
      </View>
      <Text className={`mt-1 text-[11px] font-bold ${level.text}`}>{level.label}</Text>
    </View>
  )
}
