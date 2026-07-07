import { ScrollView, Text, View } from 'react-native'

/** Tela do agente: só a interface, sem funcionalidade (FR-130/131). */
export default function AgentScreen() {
  return (
    <ScrollView className="flex-1 px-4 pt-3">
      <View className="mb-4 items-center rounded-xl border border-dashed border-line bg-surface p-4 dark:border-line-dark dark:bg-surface-dark">
        <Text className="text-sm font-bold text-foreground dark:text-foreground-dark">
          Em breve
        </Text>
        <Text className="mt-1 text-center text-xs text-muted dark:text-muted-dark">
          Converse com suas finanças por chat — e futuramente pelo WhatsApp.
        </Text>
      </View>

      <View className="opacity-55">
        <View className="mb-2 max-w-[82%] self-end rounded-xl rounded-br-sm bg-foreground px-4 py-2.5 dark:bg-foreground-dark">
          <Text className="text-sm text-background dark:text-background-dark">
            Quanto gastei com alimentação em junho?
          </Text>
        </View>
        <View className="mb-2 max-w-[82%] self-start rounded-xl rounded-bl-sm border border-line bg-surface px-4 py-2.5 dark:border-line-dark dark:bg-surface-dark">
          <Text className="text-sm text-body dark:text-body-dark">
            Em junho você gastou{' '}
            <Text className="font-bold text-foreground dark:text-foreground-dark">R$ 842,30</Text>{' '}
            com Alimentação — 12% a menos que em maio.
          </Text>
        </View>
        <View className="mb-2 max-w-[82%] self-end rounded-xl rounded-br-sm bg-foreground px-4 py-2.5 dark:bg-foreground-dark">
          <Text className="text-sm text-background dark:text-background-dark">
            E o aluguel de julho, já foi pago?
          </Text>
        </View>
        <View className="max-w-[82%] self-start rounded-xl rounded-bl-sm border border-line bg-surface px-4 py-2.5 dark:border-line-dark dark:bg-surface-dark">
          <Text className="text-sm text-body dark:text-body-dark">
            Sim — pago em 05/07, despesa já registrada no histórico. ✓
          </Text>
        </View>

        <View className="mt-4 rounded-lg border border-line bg-surface px-4 py-3 dark:border-line-dark dark:bg-surface-dark">
          <Text className="text-sm text-muted dark:text-muted-dark">
            Pergunte sobre suas finanças…
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}
