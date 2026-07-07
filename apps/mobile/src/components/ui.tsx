import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native'

/** Componentes base mobile — espelham o vocabulário de @pmf/ui-web (RE-004). */

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
}: {
  title: string
  onPress: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  disabled?: boolean
}) {
  const base = 'items-center justify-center rounded-lg px-4 py-2.5'
  const styles =
    variant === 'primary'
      ? 'bg-foreground dark:bg-foreground-dark'
      : variant === 'danger'
        ? 'bg-negative dark:bg-negative-dark'
        : 'border border-line dark:border-line-dark bg-surface dark:bg-surface-dark'
  const textStyles =
    variant === 'primary'
      ? 'text-background dark:text-background-dark'
      : variant === 'danger'
        ? 'text-white'
        : 'text-body dark:text-body-dark'
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      className={`${base} ${styles} ${disabled ? 'opacity-45' : 'active:opacity-80'}`}
    >
      <Text className={`text-sm font-bold ${textStyles}`}>{title}</Text>
    </Pressable>
  )
}

export function Input(props: TextInputProps & { label?: string }) {
  const { label, ...rest } = props
  return (
    <View className="mb-3">
      {label ? (
        <Text className="mb-1 text-xs font-bold text-foreground dark:text-foreground-dark">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor="#9C9B9B"
        {...rest}
        className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-foreground dark:border-line-dark dark:bg-surface-dark dark:text-foreground-dark"
      />
    </View>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <View
      className={`rounded-xl border border-line bg-surface p-4 dark:border-line-dark dark:bg-surface-dark ${className}`}
    >
      {children}
    </View>
  )
}

export function Kpi({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'neutral' | 'positive' | 'negative'
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-positive dark:text-positive-dark'
      : tone === 'negative'
        ? 'text-negative dark:text-negative-dark'
        : 'text-foreground dark:text-foreground-dark'
  return (
    <Card className="flex-1">
      <Text className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-muted-dark">
        {label}
      </Text>
      <Text className={`mt-1 text-lg font-black tabular-nums ${toneClass}`}>{value}</Text>
    </Card>
  )
}

export type BadgeTone = 'paid' | 'pending' | 'late' | 'info' | 'neutral'

export function Badge({ tone, label }: { tone: BadgeTone; label: string }) {
  const map: Record<BadgeTone, string> = {
    paid: 'text-positive dark:text-positive-dark bg-positive/10',
    pending: 'text-attention dark:text-attention-dark bg-attention/10',
    late: 'text-negative dark:text-negative-dark bg-negative/10',
    info: 'text-info dark:text-info-dark bg-info/10',
    neutral: 'text-muted dark:text-muted-dark bg-background dark:bg-background-dark',
  }
  return (
    <View className={`self-start rounded-full px-2 py-0.5 ${map[tone]}`}>
      <Text className={`text-[9px] font-bold uppercase ${map[tone].split(' ')[0]}`}>{label}</Text>
    </View>
  )
}

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      className={`h-6 w-11 justify-center rounded-full px-0.5 ${
        checked ? 'bg-positive dark:bg-positive-dark' : 'bg-line dark:bg-line-dark'
      } ${disabled ? 'opacity-45' : ''}`}
    >
      <View className={`h-5 w-5 rounded-full bg-white shadow ${checked ? 'self-end' : 'self-start'}`} />
    </Pressable>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View className="items-center rounded-xl border border-dashed border-line px-6 py-10 dark:border-line-dark">
      <Text className="text-sm font-bold text-foreground dark:text-foreground-dark">{title}</Text>
      {hint ? (
        <Text className="mt-1 text-center text-xs text-muted dark:text-muted-dark">{hint}</Text>
      ) : null}
    </View>
  )
}

export function ScreenTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-3 text-xl font-black text-foreground dark:text-foreground-dark">
      {children}
    </Text>
  )
}
