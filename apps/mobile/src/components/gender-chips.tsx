import { Pressable, Text, View } from 'react-native'
import type { Gender } from '@pmf/schemas'
import { GENDER_OPTIONS } from '@/lib/profile-fields'

/** Seleção de gênero em chips; tocar no chip ativo desmarca (campo opcional). */
export function GenderChips({
  value,
  onChange,
}: {
  value: Gender | ''
  onChange: (value: Gender | '') => void
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-bold text-body dark:text-body-dark">
        Gênero (opcional)
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {GENDER_OPTIONS.map((option) => {
          const active = value === option.value
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(active ? '' : option.value)}
              accessibilityRole="button"
              className={`rounded-full border px-3 py-1.5 ${
                active
                  ? 'border-foreground bg-foreground dark:border-foreground-dark dark:bg-foreground-dark'
                  : 'border-line dark:border-line-dark'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  active
                    ? 'text-background dark:text-background-dark'
                    : 'text-body dark:text-body-dark'
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
