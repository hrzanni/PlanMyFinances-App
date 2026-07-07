import { ScrollView, View } from 'react-native'
import { trpc } from '@/lib/trpc'
import { money } from '@/lib/format'
import { EmptyState, Kpi } from '@/components/ui'
import { InstallmentCard } from '@/components/installment-list'

const statuses = ['pendente', 'cobrado', 'pago'] as const

export default function ChargesScreen() {
  const utils = trpc.useUtils()
  const list = trpc.charges.list.useQuery()
  const summary = trpc.charges.summary.useQuery()
  const setStatus = trpc.charges.setStatus.useMutation({
    onSuccess: () => utils.charges.invalidate(),
  })

  return (
    <ScrollView className="flex-1 px-4 pt-3">
      <View className="mb-2 flex-row gap-2">
        <Kpi label="A receber" value={money(summary.data?.receivable ?? 0)} />
        <Kpi label="Vence no mês" value={money(summary.data?.dueThisMonth ?? 0)} />
      </View>
      <View className="mb-4">
        <Kpi label="Total recebido" value={money(summary.data?.received ?? 0)} tone="positive" />
      </View>

      {list.data && list.data.length > 0 ? (
        list.data.map((row) => (
          <InstallmentCard
            key={row.id}
            row={{ ...row, title: row.debtorName }}
            statuses={statuses}
            onSetStatus={(status) =>
              setStatus.mutate({ id: row.id, status: status as (typeof statuses)[number] })
            }
          />
        ))
      ) : (
        <EmptyState title="Nenhuma cobrança" hint="Cadastre pela versão web por enquanto." />
      )}
      <View className="h-8" />
    </ScrollView>
  )
}
