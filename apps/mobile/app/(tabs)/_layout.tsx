import { Tabs, Redirect } from 'expo-router'
import { Text, useColorScheme } from 'react-native'
import { useSession } from '@/lib/auth-client'

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.45 }} accessibilityElementsHidden>
      {label}
    </Text>
  )
}

/** 5 tabs (FR-151). Guard: sem sessão → login. */
export default function TabsLayout() {
  const scheme = useColorScheme()
  const { data: session, isPending } = useSession()
  if (!isPending && !session) return <Redirect href="/login" />

  const dark = scheme === 'dark'
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: dark ? '#161919' : '#FFFFFF',
          borderTopColor: dark ? '#292D2D' : '#E4E4E2',
        },
        tabBarActiveTintColor: dark ? '#FFFFFF' : '#0C0E0E',
        tabBarInactiveTintColor: '#9C9B9B',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ focused }) => <TabIcon label="🕐" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="fixos"
        options={{
          title: 'Fixos',
          tabBarIcon: ({ focused }) => <TabIcon label="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dash"
        options={{
          title: 'Dash',
          tabBarIcon: ({ focused }) => <TabIcon label="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="mais"
        options={{
          title: 'Mais',
          tabBarIcon: ({ focused }) => <TabIcon label="⋯" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
