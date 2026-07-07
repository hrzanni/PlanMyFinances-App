import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useSession } from '@/lib/auth-client'

/** Porta de entrada: decide entre login e as tabs conforme a sessão. */
export default function Index() {
  const { data: session, isPending } = useSession()
  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-background-dark">
        <ActivityIndicator />
      </View>
    )
  }
  return <Redirect href={session ? '/(tabs)/inicio' : '/login'} />
}
