import { ScrollView, Text, View } from 'react-native'
import { EmptyState } from '@/components/ui'

/** Conexões (Meu Pluggy) — integração chega na fase 4; a tela já explica o fluxo. */
export default function ConnectionsScreen() {
  return (
    <ScrollView className="flex-1 px-4 pt-3">
      <EmptyState
        title="Integração em preparação"
        hint="Crie sua conta gratuita em meu.pluggy.ai, conecte seus bancos e gere as credenciais de desenvolvimento para ativar a sincronização."
      />
      <View className="mt-4 rounded-r-lg border-l-4 border-info bg-info/5 px-4 py-3 dark:border-info-dark">
        <Text className="text-xs font-bold text-foreground dark:text-foreground-dark">
          Como funciona a segurança
        </Text>
        <Text className="mt-1 text-xs leading-4 text-body dark:text-body-dark">
          Você nunca informa sua senha bancária aqui. A conexão é aprovada dentro do app do seu
          banco (Open Finance regulado pelo Banco Central) e pode ser revogada a qualquer momento.
          Este app apenas lê transações — não movimenta dinheiro.
        </Text>
      </View>
    </ScrollView>
  )
}
