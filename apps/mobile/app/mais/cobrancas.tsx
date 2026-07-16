import { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { chargeEffectiveState, chargesKpis } from '@pmf/core'
import { trpc } from '@/lib/trpc'
import { Button, EmptyState } from '@/components/ui'
import { ChargeKpis } from '@/components/charges/charge-kpis'
import {
  ChargeStatusPills,
  type ChargeStatusFilter,
} from '@/components/charges/charge-status-pills'
import { ChargeCard } from '@/components/charges/charge-card'
import { toChargeState, type ChargeRow } from '@/components/charges/charge-adapt'
import { ChargeDetailSheet } from '@/components/charges/charge-detail-sheet'
import { ChargeFormModal } from '@/components/charge-form-modal'

type FormState = { mode: 'create' } | { mode: 'edit'; charge: ChargeRow } | null

export default function ChargesScreen() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const list = trpc.charges.list.useQuery()
  const rows = list.data ?? []

  const [statusFilter, setStatusFilter] = useState<ChargeStatusFilter>('todas')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(null)

  const kpis = useMemo(
    () => chargesKpis(rows.map(toChargeState), today),
    [rows, today],
  )

  const withState = useMemo(
    () => rows.map((row) => ({ row, state: chargeEffectiveState(toChargeState(row), today) })),
    [rows, today],
  )

  const counts: Record<ChargeStatusFilter, number> = {
    todas: withState.length,
    pendentes: withState.filter((r) => r.state === 'pendente' || r.state === 'cobrado').length,
    atrasadas: withState.filter((r) => r.state === 'atrasada').length,
    pagas: withState.filter((r) => r.state === 'pago').length,
  }

  const visible = withState.filter(({ state }) => {
    if (statusFilter === 'todas') return true
    if (statusFilter === 'pendentes') return state === 'pendente' || state === 'cobrado'
    if (statusFilter === 'atrasadas') return state === 'atrasada'
    return state === 'pago'
  })

  const selectedCharge = rows.find((r) => r.id === selectedId) ?? null

  return (
    <ScrollView className="flex-1 px-4 pt-3">
      <ChargeKpis kpis={kpis} />
      <ChargeStatusPills value={statusFilter} onChange={setStatusFilter} counts={counts} />

      <View className="mb-4">
        <Button title="+ Nova cobrança" onPress={() => setForm({ mode: 'create' })} />
      </View>

      {visible.length > 0 ? (
        visible.map(({ row }) => (
          <ChargeCard key={row.id} row={row} today={today} onOpen={() => setSelectedId(row.id)} />
        ))
      ) : (
        <EmptyState
          title="Nenhuma cobrança"
          hint="Registre valores a receber de terceiros, com parcelas e vencimento."
        />
      )}
      <View className="h-8" />

      <ChargeFormModal
        open={form !== null}
        editing={form?.mode === 'edit' ? form.charge : null}
        onClose={() => setForm(null)}
      />

      <ChargeDetailSheet
        charge={selectedCharge}
        today={today}
        onClose={() => setSelectedId(null)}
        onEdit={(charge) => {
          setSelectedId(null)
          setForm({ mode: 'edit', charge })
        }}
      />
    </ScrollView>
  )
}
