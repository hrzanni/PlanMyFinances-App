import { Pressable, Text, View } from 'react-native'
import { formatDate } from '@pmf/core'
import { trpc } from '@/lib/trpc'
import { money } from '@/lib/format'

/** Histórico de recebimentos de uma cobrança, com desfazer (extraído do modal de recebimento). */
export function ChargePaymentHistory({ chargeId }: { chargeId: string }) {
  const utils = trpc.useUtils()
  const payments = trpc.charges.payments.useQuery({ id: chargeId })
  const unregister = trpc.charges.unregisterPayment.useMutation({
    onSuccess: () => {
      utils.charges.invalidate()
      utils.transactions.invalidate()
      utils.dashboard.invalidate()
    },
  })

  if (!payments.data || payments.data.length === 0) return null

  return (
    <View className="mt-4 border-t border-line pt-3 dark:border-line-dark">
      <Text className="mb-2 text-xs font-bold text-muted dark:text-muted-dark">
        Histórico de recebimentos
      </Text>
      {payments.data.map((p) => (
        <View key={p.id} className="mb-1 flex-row items-center justify-between">
          <Text className="text-xs text-body dark:text-body-dark">
            {formatDate(String(p.createdAt).slice(0, 10))} ·{' '}
            <Text className="font-bold text-positive dark:text-positive-dark">
              {money(p.amount)}
            </Text>
          </Text>
          <Pressable
            hitSlop={8}
            disabled={unregister.isPending}
            onPress={() => unregister.mutate({ paymentId: p.id })}
          >
            <Text className="text-xs text-muted underline dark:text-muted-dark">desfazer</Text>
          </Pressable>
        </View>
      ))}
    </View>
  )
}
