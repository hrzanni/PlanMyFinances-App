import { Stack, router, usePathname } from 'expo-router'
import { Pressable, Text, View, useColorScheme } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

const titles: Record<string, string> = {
  perfil: 'Perfil',
  pastas: 'Pastas',
  categorias: 'Categorias',
  cobrancas: 'Cobranças',
  faturas: 'Faturas',
  conexoes: 'Conexões',
  agente: 'Agente',
}

/**
 * Stack do grupo "Mais" com header próprio (não o nativo): o header do
 * react-native-screens fica sob a barra de status no Android com o
 * edge-to-edge do SDK 53 (expo/expo#36685), então o inset vem do
 * SafeAreaView, que é confiável.
 */
export default function MoreStackLayout() {
  const dark = useColorScheme() === 'dark'
  const pathname = usePathname()
  const screen = pathname.split('/').pop() ?? ''
  const title = titles[screen] ?? ''

  return (
    <View className="flex-1">
      <SafeAreaView edges={['top']} className="bg-surface dark:bg-surface-dark">
        <View className="h-14 flex-row items-center border-b border-line px-2 dark:border-line-dark">
          <Pressable
            accessibilityLabel="Voltar"
            hitSlop={8}
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color={dark ? '#FFFFFF' : '#0C0E0E'} />
          </Pressable>
          <Text className="text-lg font-black text-foreground dark:text-foreground-dark">
            {title}
          </Text>
        </View>
      </SafeAreaView>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: dark ? '#0C0E0E' : '#F5F5F5' },
        }}
      />
    </View>
  )
}
