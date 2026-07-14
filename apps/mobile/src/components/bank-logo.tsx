import { Text, View } from 'react-native'
import { bankPresetInfo } from '@pmf/core'

/** Marca do banco do cartão (fase 8.2): monograma nas cores da marca, sem asset externo. */
export function BankLogo({ preset, size = 32 }: { preset: string; size?: number }) {
  const info = bankPresetInfo(preset)
  return (
    <View
      accessibilityLabel={info.label}
      className="items-center justify-center rounded-lg"
      style={{ width: size, height: size, backgroundColor: info.color }}
    >
      <Text style={{ color: info.markColor, fontSize: size * 0.4, fontWeight: '900' }}>
        {info.mark}
      </Text>
    </View>
  )
}
