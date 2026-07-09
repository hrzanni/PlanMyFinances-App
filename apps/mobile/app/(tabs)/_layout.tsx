import { Tabs, Redirect } from 'expo-router'
import { useColorScheme } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSession } from '@/lib/auth-client'
import { isDevBypassEnabled } from '@/lib/dev-mode'

type IconName = keyof typeof Ionicons.glyphMap

function TabIcon({
  name,
  focusedName,
  color,
  focused,
}: {
  name: IconName
  focusedName: IconName
  color: string
  focused: boolean
}) {
  return <Ionicons name={focused ? focusedName : name} size={20} color={color} />
}

/** 5 tabs (FR-151). Guard: sem sessão → login. */
export default function TabsLayout() {
  const scheme = useColorScheme()
  const { data: session, isPending } = useSession()
  if (!isPending && !isDevBypassEnabled && !session) return <Redirect href="/login" />

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
          tabBarIcon: (p) => <TabIcon name="home-outline" focusedName="home" {...p} />,
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarIcon: (p) => <TabIcon name="time-outline" focusedName="time" {...p} />,
        }}
      />
      <Tabs.Screen
        name="fixos"
        options={{
          title: 'Fixos',
          tabBarIcon: (p) => <TabIcon name="calendar-outline" focusedName="calendar" {...p} />,
        }}
      />
      <Tabs.Screen
        name="dash"
        options={{
          title: 'Dash',
          tabBarIcon: (p) => (
            <TabIcon name="stats-chart-outline" focusedName="stats-chart" {...p} />
          ),
        }}
      />
      <Tabs.Screen
        name="mais"
        options={{
          title: 'Mais',
          tabBarIcon: (p) => (
            <TabIcon name="ellipsis-horizontal" focusedName="ellipsis-horizontal" {...p} />
          ),
        }}
      />
    </Tabs>
  )
}
