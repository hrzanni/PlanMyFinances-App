'use client'

import { useState } from 'react'
import { formatDate, installmentTotals, toNumber } from '@pmf/core'
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
import {
  InstallmentFormFields,
  emptyInstallmentDraft,
  parseInstallmentDraft,
  validateInstallmentDraft,
  type InstallmentDraft,
} from '@/components/installment-form-fields'

const statuses = ['pendente', 'pago'] as const

export default function InvoicesPage() {
  const utils = trpc.useUtils()
  const list = trpc.invoices.list.useQuery()
  const summary = trpc.invoices.summary.useQuery()
  const invalidate = () => utils.invoices.invalidate()

  const create = trpc.invoices.create.useMutation({ onSuccess: invalidate })
  const setStatus = trpc.invoices.setStatus.useMutation({ onSuccess: invalidate })
  const del = trpc.invoices.delete.useMutation({ onSuccess: invalidate })

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<InstallmentDraft>(emptyInstallmentDraft)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validateInstallmentDraft(draft)
    if (err) return setError(err)
    setError(null)
    create.mutate(
      { cardName: draft.name, status: 'pendente', ...parseInstallmentDraft(draft) },
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
            Faturas <span className="text-sm font-normal text-muted">· a pagar</span>
          </>
        }
      >
        <Button onClick={() => setOpen(true)}>+ Nova fatura</Button>
      </PageHeader>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Kpi label="Em aberto" value={money(summary.data?.open ?? 0)} tone="negative" />
        <Kpi label="Vence este mês" value={money(summary.data?.dueThisMonth ?? 0)} />
        <Kpi label="Total pago" value={money(summary.data?.paid ?? 0)} tone="positive" />
      </div>

      <Card>
        {list.isLoading ? (
          <LoadingState />
        ) : list.data && list.data.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <Th>Cartão</Th>
                <Th numeric>Parcela</Th>
                <Th numeric>Total</Th>
                <Th numeric>Pago</Th>
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
                      <span className="font-bold text-foreground">{row.cardName}</span>
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
                        aria-label={`Status de ${row.cardName}`}
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
                      <button
                        type="button"
                        aria-label={`Excluir fatura ${row.cardName}`}
                        className="text-muted hover:text-negative"
                        onClick={() => {
                          if (window.confirm(`Excluir a fatura "${row.cardName}"?`)) {
                            del.mutate({ id: row.id })
                          }
                        }}
                      >
                        🗑
                      </button>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            title="Nenhuma fatura"
            hint="Registre parcelamentos de cartão com valor, parcelas e vencimento."
          />
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Nova fatura">
          <form onSubmit={handleSubmit}>
            <InstallmentFormFields draft={draft} nameLabel="Cartão" onChange={setDraft} />
            {error ? <p className="mb-3 text-xs font-bold text-negative">{error}</p> : null}
            <Button type="submit" disabled={create.isPending} className="w-full">
              Salvar fatura
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
