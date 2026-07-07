import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'

/** Stack do grupo "Mais" com header nativo e botão voltar. */
export default function MoreStackLayout() {
  const dark = useColorScheme() === 'dark'
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: dark ? '#161919' : '#FFFFFF' },
        headerTintColor: dark ? '#FFFFFF' : '#0C0E0E',
        headerTitleStyle: { fontWeight: '900' },
        contentStyle: { backgroundColor: dark ? '#0C0E0E' : '#F5F5F5' },
      }}
    >
      <Stack.Screen name="pastas" options={{ title: 'Pastas' }} />
      <Stack.Screen name="categorias" options={{ title: 'Categorias' }} />
      <Stack.Screen name="cobrancas" options={{ title: 'Cobranças' }} />
      <Stack.Screen name="faturas" options={{ title: 'Faturas' }} />
      <Stack.Screen name="conexoes" options={{ title: 'Conexões' }} />
      <Stack.Screen name="agente" options={{ title: 'Agente' }} />
    </Stack>
  )
}
