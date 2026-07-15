import { Text, View, useColorScheme } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

/** Peças da agenda de fixos (tela Fixos + widget da Início) — versão RN. */

export function TypeIcon({ type }: { type: 'despesa' | 'receita' }) {
  const dark = useColorScheme() === 'dark'
  const income = type === 'receita'
  const color = income ? (dark ? '#5CBF8B' : '#2D6E44') : dark ? '#F0707A' : '#BA1925'
  return (
    <View
      className={`h-8 w-8 items-center justify-center rounded-full ${
        income ? 'bg-positive/10' : 'bg-negative/10'
      }`}
    >
      <Ionicons name={income ? 'trending-up' : 'trending-down'} size={14} color={color} />
    </View>
  )
}

export function DayDot({
  day,
  monthAbbr,
  today = false,
}: {
  day: number
  monthAbbr: string
  today?: boolean
}) {
  return (
    <View
      className={`h-10 w-10 items-center justify-center rounded-full border ${
        today
          ? 'border-foreground bg-foreground dark:border-foreground-dark dark:bg-foreground-dark'
          : 'border-line bg-background dark:border-line-dark dark:bg-background-dark'
      }`}
    >
      <Text
        className={`text-xs font-black leading-none ${
          today
            ? 'text-background dark:text-background-dark'
            : 'text-foreground dark:text-foreground-dark'
        }`}
      >
        {String(day).padStart(2, '0')}
      </Text>
      <Text
        className={`text-[7px] font-bold uppercase leading-none ${
          today ? 'text-background/70 dark:text-background-dark/70' : 'text-muted dark:text-muted-dark'
        }`}
      >
        {today ? 'hoje' : monthAbbr}
      </Text>
    </View>
  )
}
