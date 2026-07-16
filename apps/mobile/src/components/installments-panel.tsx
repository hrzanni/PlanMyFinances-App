import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { InstallmentState } from '@pmf/core'
import { money } from '@/lib/format'
import { Badge } from './ui'
import { InstallmentChips } from './installment-chips'

/** Chevron via Ionicons com rotação (nunca o glifo ▶). */
export function Chevron({ open, color }: { open: boolean; color?: string }) {
  return (
    <Ionicons
      name="chevron-down"
      size={12}
      color={color ?? '#9C9B9B'}
      style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
    />
  )
}

const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

function statusBadge(st: InstallmentState) {
  if (st.paid) return <Badge tone="paid" label="paga" />
  if (st.overdue) return <Badge tone="late" label="em atraso" />
  return <Badge tone="pending" label="pendente" />
}

/** Painel de parcelas de UMA fatura: chips numerados + linhas únicas. */
export function InstallmentsPanel({
  installments,
  onOpenPayment,
}: {
  installments: InstallmentState[]
  onOpenPayment: (n: number) => void
}) {
  const paidCount = installments.filter((s) => s.paid).length
  const firstUnpaid = installments.find((s) => !s.paid)?.number ?? -1

  return (
    <View className="mt-2 rounded-xl bg-background/60 p-3 dark:bg-background-dark/60">
      <Text className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted dark:text-muted-dark">
        Parcelas · {paidCount} de {installments.length} pagas
      </Text>
      <View className="mb-2">
        <InstallmentChips installments={installments} onSelect={onOpenPayment} />
      </View>
      {installments.map((st) => (
        <View
          key={st.number}
          className="flex-row items-center gap-2 border-t border-line py-1.5 dark:border-line-dark"
        >
          <Text className="text-[11px] font-bold text-foreground dark:text-foreground-dark">
            P. {st.number}
          </Text>
          <Text className="text-[11px] tabular-nums text-body dark:text-body-dark">
            {ddmm(st.dueDate)}
          </Text>
          <Text className="text-[11px] tabular-nums text-body dark:text-body-dark">
            {st.paid ? money(st.amountPaid ?? 0) : '—'}
          </Text>
          {statusBadge(st)}
          <Pressable className="ml-auto" hitSlop={6} onPress={() => onOpenPayment(st.number)}>
            <Text
              className={`text-[11px] underline ${
                st.number === firstUnpaid
                  ? 'font-bold text-foreground dark:text-foreground-dark'
                  : 'text-muted dark:text-muted-dark'
              }`}
            >
              {st.paid ? 'editar' : 'registrar'}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  )
}
