'use client'

import { useState } from 'react'
import {
  emptyInstallmentDraft,
  formatDate,
  installmentTotals,
  parseInstallmentDraft,
  toNumber,
  validateInstallmentDraft,
  type InstallmentDraft,
} from '@pmf/core'
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  EmptyState,
  Kpi,
  LoadingState,
  Select,
  Table,
  Td,
  Th,
} from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { money } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { ChargeFormFields } from '@/components/charge-form-fields'
import {
  ChargePaymentDialog,
  type ChargePaymentTarget,
} from '@/components/charge-payment-dialog'

const statuses = ['pendente', 'cobrado', 'pago'] as const

export default function ChargesPage() {
  const utils = trpc.useUtils()
  const list = trpc.charges.list.useQuery()
  const summary = trpc.charges.summary.useQuery()
  const invalidate = () => utils.charges.invalidate()

  const create = trpc.charges.create.useMutation({ onSuccess: invalidate })
  const setStatus = trpc.charges.setStatus.useMutation({ onSuccess: invalidate })
  const del = trpc.charges.delete.useMutation({ onSuccess: invalidate })

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<InstallmentDraft>(emptyInstallmentDraft)
  const [error, setError] = useState<string | null>(null)
  // guarda só o id: o alvo é derivado da lista para o diálogo refletir o cache atualizado
  const [payingId, setPayingId] = useState<string | null>(null)
  const paying: ChargePaymentTarget | null =
    list.data?.find((r) => r.id === payingId) ?? null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validateInstallmentDraft(draft)
    if (err) return setError(err)
    setError(null)
    create.mutate(
      { debtorName: draft.name, status: 'pendente', ...parseInstallmentDraft(draft) },
      {
        onSuccess: () => {
          setOpen(false)
          setDraft(emptyInstallmentDraft)
        },
      },
    )
  }

  return (
    <>
      <PageHeader
        title={
          <>
            Cobranças <span className="text-sm font-normal text-muted">· a receber</span>
          </>
        }
      >
        <Button onClick={() => setOpen(true)}>+ Nova cobrança</Button>
      </PageHeader>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Kpi label="A receber" value={money(summary.data?.receivable ?? 0)} />
        <Kpi label="Vence este mês" value={money(summary.data?.dueThisMonth ?? 0)} />
        <Kpi label="Total recebido" value={money(summary.data?.received ?? 0)} tone="positive" />
      </div>

      <Card>
        {list.isLoading ? (
          <LoadingState />
        ) : list.data && list.data.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <Th>Devedor</Th>
                <Th numeric>Parcela</Th>
                <Th numeric>Total</Th>
                <Th numeric>Recebido</Th>
                <Th numeric>Restante</Th>
                <Th>Vencimento</Th>
                <Th>Status</Th>
                <Th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {list.data.map((row) => {
                const totals = installmentTotals(
                  toNumber(row.amountPerInstallment),
                  row.totalInstallments,
                  toNumber(row.amountPaid),
                )
                return (
                  <tr key={row.id}>
                    <Td>
                      <span className="font-bold text-foreground">{row.debtorName}</span>
                      {row.description ? (
                        <span className="block text-xs text-muted">{row.description}</span>
                      ) : null}
                    </Td>
                    <Td numeric>
                      {money(row.amountPerInstallment)} ×{row.totalInstallments}
                    </Td>
                    <Td numeric>{money(totals.total)}</Td>
                    <Td numeric>
                      <span className="font-bold text-positive">{money(row.amountPaid)}</span>
                    </Td>
                    <Td numeric>{money(totals.remaining)}</Td>
                    <Td>{row.dueDate ? formatDate(row.dueDate) : '—'}</Td>
                    <Td>
                      <Select
                        aria-label={`Status de ${row.debtorName}`}
                        className="w-28 py-1 text-xs"
                        value={row.status}
                        onChange={(e) =>
                          setStatus.mutate({
                            id: row.id,
                            status: e.target.value as (typeof statuses)[number],
                          })
                        }
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </Td>
                    <Td numeric>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="whitespace-nowrap text-xs font-bold text-positive underline hover:opacity-80"
                          onClick={() => setPayingId(row.id)}
                        >
                          + receber
                        </button>
                        <button
                          type="button"
                          aria-label={`Excluir cobrança de ${row.debtorName}`}
                          className="text-muted hover:text-negative"
                          onClick={() => {
                            if (window.confirm(`Excluir a cobrança de "${row.debtorName}"?`)) {
                              del.mutate({ id: row.id })
                            }
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            title="Nenhuma cobrança"
            hint="Registre valores a receber de terceiros, com parcelas e vencimento."
          />
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Nova cobrança">
          <form onSubmit={handleSubmit}>
            <ChargeFormFields draft={draft} onChange={setDraft} />
            {error ? <p className="mb-3 text-xs font-bold text-negative">{error}</p> : null}
            <Button type="submit" disabled={create.isPending} className="w-full">
              Salvar cobrança
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ChargePaymentDialog charge={paying} onClose={() => setPayingId(null)} />
    </>
  )
}
