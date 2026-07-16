'use client'

import { useMemo, useState } from 'react'
import {
  chargeEffectiveState,
  chargesKpis,
  emptyInstallmentDraft,
  parseInstallmentDraft,
  validateInstallmentDraft,
  type InstallmentDraft,
} from '@pmf/core'
import { Button, Dialog, DialogContent, LoadingState } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { ChargeFormFields } from '@/components/charge-form-fields'
import { ChargesHeader } from '@/components/charges/charge-header'
import { ChargeGrid } from '@/components/charges/charge-grid'
import { ChargeDetailDrawer } from '@/components/charges/charge-detail-drawer'
import { toChargeState, chargeToDraft, type ChargeRow } from '@/components/charges/charge-adapt'
import type { ChargeStatusFilter } from '@/components/charges/charge-status-pills'

type FormState = { mode: 'create' } | { mode: 'edit'; charge: ChargeRow } | null

function matchesFilter(state: ReturnType<typeof chargeEffectiveState>, filter: ChargeStatusFilter) {
  if (filter === 'todas') return true
  if (filter === 'pendentes') return state === 'pendente' || state === 'cobrado'
  if (filter === 'atrasadas') return state === 'atrasada'
  return state === 'pago'
}

export default function ChargesPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const utils = trpc.useUtils()
  const list = trpc.charges.list.useQuery()
  const invalidate = () => utils.charges.invalidate()

  const create = trpc.charges.create.useMutation({ onSuccess: invalidate })
  const update = trpc.charges.update.useMutation({ onSuccess: invalidate })

  const [filter, setFilter] = useState<ChargeStatusFilter>('todas')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(null)
  const [draft, setDraft] = useState<InstallmentDraft>(emptyInstallmentDraft)
  const [error, setError] = useState<string | null>(null)

  const rows = list.data ?? []
  const withState = useMemo(
    () => rows.map((row) => ({ row, state: chargeEffectiveState(toChargeState(row), today) })),
    [rows, today],
  )
  const kpis = useMemo(() => chargesKpis(rows.map(toChargeState), today), [rows, today])
  const counts: Record<ChargeStatusFilter, number> = {
    todas: rows.length,
    pendentes: withState.filter((r) => matchesFilter(r.state, 'pendentes')).length,
    atrasadas: withState.filter((r) => matchesFilter(r.state, 'atrasadas')).length,
    pagas: withState.filter((r) => matchesFilter(r.state, 'pagas')).length,
  }
  const visible = withState.filter((r) => matchesFilter(r.state, filter)).map((r) => r.row)
  const selectedCharge = rows.find((r) => r.id === selectedId) ?? null

  function openCreate() {
    setDraft(emptyInstallmentDraft)
    setError(null)
    setForm({ mode: 'create' })
  }

  function openEdit(charge: ChargeRow) {
    setDraft(chargeToDraft(charge))
    setError(null)
    setForm({ mode: 'edit', charge })
    setSelectedId(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validateInstallmentDraft(draft)
    if (err) return setError(err)
    setError(null)
    const parsed = parseInstallmentDraft(draft)
    if (form?.mode === 'edit') {
      update.mutate(
        { id: form.charge.id, debtorName: draft.name, status: form.charge.status, ...parsed },
        { onSuccess: () => setForm(null) },
      )
    } else {
      create.mutate(
        { debtorName: draft.name, status: 'pendente', ...parsed },
        { onSuccess: () => setForm(null) },
      )
    }
  }

  return (
    <>
      <ChargesHeader
        kpis={kpis}
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
        onCreate={openCreate}
      />

      {list.isLoading ? (
        <LoadingState />
      ) : (
        <ChargeGrid
          charges={visible}
          today={today}
          emptyTitle={filter === 'todas' ? 'Nenhuma cobrança' : 'Nenhuma cobrança neste filtro'}
          emptyHint={
            filter === 'todas'
              ? 'Registre valores a receber de terceiros, com parcelas e vencimento.'
              : undefined
          }
          onOpen={(charge) => setSelectedId(charge.id)}
        />
      )}

      <Dialog open={form !== null} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent title={form?.mode === 'edit' ? 'Editar cobrança' : 'Nova cobrança'}>
          <form onSubmit={handleSubmit}>
            <ChargeFormFields draft={draft} onChange={setDraft} />
            {error ? <p className="mb-3 text-xs font-bold text-negative">{error}</p> : null}
            <Button
              type="submit"
              disabled={create.isPending || update.isPending}
              className="w-full"
            >
              {form?.mode === 'edit' ? 'Salvar alterações' : 'Salvar cobrança'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ChargeDetailDrawer
        charge={selectedCharge}
        today={today}
        onClose={() => setSelectedId(null)}
        onEdit={openEdit}
      />
    </>
  )
}
