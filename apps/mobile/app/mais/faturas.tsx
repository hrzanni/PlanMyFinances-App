import { ScrollView, View } from 'react-native'
import { trpc } from '@/lib/trpc'
import { money } from '@/lib/format'
import { EmptyState, Kpi } from '@/components/ui'
import { InstallmentCard } from '@/components/installment-list'

const statuses = ['pendente', 'pago'] as const

export default function InvoicesScreen() {
  const utils = trpc.useUtils()
  const list = trpc.invoices.list.useQuery()
  const summary = trpc.invoices.summary.useQuery()
  const setStatus = trpc.invoices.setStatus.useMutation({
    onSuccess: () => utils.invoices.invalidate(),
  })

  return (
    <ScrollView className="flex-1 px-4 pt-3">
      <View className="mb-2 flex-row gap-2">
        <Kpi label="Em aberto" value={money(summary.data?.open ?? 0)} tone="negative" />
        <Kpi label="Vence no mês" value={money(summary.data?.dueThisMonth ?? 0)} />
      </View>
      <View className="mb-4">
        <Kpi label="Total pago" value={money(summary.data?.paid ?? 0)} tone="positive" />
      </View>

      {list.data && list.data.length > 0 ? (
        list.data.map((row) => (
          <InstallmentCard
            key={row.id}
            row={{ ...row, title: row.cardName }}
            statuses={statuses}
            onSetStatus={(status) =>
              setStatus.mutate({ id: row.id, status: status as (typeof statuses)[number] })
            }
          />
        ))
      ) : (
        <EmptyState title="Nenhuma fatura" hint="Cadastre pela versão web por enquanto." />
      )}
      <View className="h-8" />
    </ScrollView>
  )
}
