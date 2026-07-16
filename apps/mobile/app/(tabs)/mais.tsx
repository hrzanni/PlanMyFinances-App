import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, type Href } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ScreenTitle } from '@/components/ui'
import { signOut } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc'

type IconName = keyof typeof Ionicons.glyphMap

const items: Array<{ href: Href; label: string; icon: IconName; soon?: boolean }> = [
  { href: '/mais/perfil', label: 'Perfil', icon: 'person-circle-outline' },
  { href: '/mais/pastas', label: 'Pastas', icon: 'folder-outline' },
  { href: '/mais/categorias', label: 'Categorias', icon: 'pricetags-outline' },
  { href: '/mais/cobrancas', label: 'Cobranças', icon: 'arrow-down-circle-outline' },
  { href: '/mais/conexoes', label: 'Conexões', icon: 'link-outline', soon: true },
  { href: '/mais/agente', label: 'Agente', icon: 'chatbubble-ellipses-outline', soon: true },
]

export default function MoreScreen() {
  const router = useRouter()
  const me = trpc.users.me.useQuery()
  const dark = useColorScheme() === 'dark'
  const iconColor = dark ? '#FFFFFF' : '#0C0E0E'

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-3">
        <ScreenTitle>Mais</ScreenTitle>
        <View className="overflow-hidden rounded-xl border border-line bg-surface dark:border-line-dark dark:bg-surface-dark">
          {items.map((item, i) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={() => router.push(item.href)}
              className={`flex-row items-center gap-3 px-4 py-3.5 active:bg-background dark:active:bg-background-dark ${
                i > 0 ? 'border-t border-line dark:border-line-dark' : ''
              }`}
            >
              <Ionicons name={item.icon} size={18} color={iconColor} />
              <Text className="flex-1 text-sm font-bold text-foreground dark:text-foreground-dark">
                {item.label}
              </Text>
              {item.soon ? (
                <Text className="rounded-full bg-attention/10 px-2 py-0.5 text-[9px] font-bold uppercase text-attention dark:text-attention-dark">
                  Em breve
                </Text>
              ) : null}
              <Ionicons name="chevron-forward" size={14} color="#9C9B9B" />
            </Pressable>
          ))}
        </View>

        <View className="mt-6 items-center">
          <Text className="text-xs text-muted dark:text-muted-dark">{me.data?.email}</Text>
          <Pressable onPress={handleSignOut} accessibilityRole="button" className="mt-2 py-2">
            <Text className="text-sm font-bold text-negative dark:text-negative-dark">Sair</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
