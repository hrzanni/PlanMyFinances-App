'use client'

import { useMemo, useState } from 'react'
import {
  emptyInvoiceDraft,
  isInvoiceClosed,
  parseInvoiceDraft,
  validateInvoiceDraft,
  type InvoiceDraft,
} from '@pmf/core'
import { Button, Card, Dialog, DialogContent, EmptyState, LoadingState } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { currentMonth } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { BankLogo } from '@/components/bank-logo'
import { CardStrip } from '@/components/card-strip'
import { InvoiceMonthHero } from '@/components/invoice-month-hero'
import { InvoiceFormFields } from '@/components/invoice-form-fields'
import { InvoiceTable } from '@/components/invoice-table'
import { ClosedInvoices } from '@/components/closed-invoices'
import {
  InstallmentPaymentDialog,
  type PaymentTarget,
} from '@/components/installment-payment-dialog'
import { toPayments, toSchedule, type InvoiceRow } from '@/components/invoice-derive'

export default function InvoicesPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const utils = trpc.useUtils()
  const list = trpc.invoices.list.useQuery()
  const cards = trpc.cards.list.useQuery()
  const create = trpc.invoices.create.useMutation({ onSuccess: () => utils.invoices.invalidate() })
  const del = trpc.invoices.delete.useMutation({ onSuccess: () => utils.invoices.invalidate() })

  const [month, setMonth] = useState(currentMonth)
  const [cardFilter, setCardFilter] = useState<string | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [payingTarget, setPayingTarget] = useState<PaymentTarget | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState<InvoiceDraft>(emptyInvoiceDraft)
  const [error, setError] = useState<string | null>(null)

  const rows = list.data ?? []
  const filtered = cardFilter === 'all' ? rows : rows.filter((r) => r.cardId === cardFilter)
  const closedOf = (r: InvoiceRow) => isInvoiceClosed(toSchedule(r), toPayments(r))
  const active = filtered.filter((r) => !closedOf(r))
  const closed = filtered.filter(closedOf)
  const heroRows = useMemo(
    () => filtered.map((r) => ({ schedule: toSchedule(r), payments: toPayments(r) })),
    [filtered],
  )

  const tableProps = {
    month,
    today,
    expandedId,
    onToggle: (id: string) => setExpandedId((cur) => (cur === id ? null : id)),
    onOpenPayment: (invoiceId: string, n: number) =>
      setPayingTarget({ invoiceId, installmentNumber: n }),
    onDelete: (row: InvoiceRow) => {
      if (window.confirm(`Excluir a fatura "${row.description || row.cardName}"?`))
        del.mutate({ id: row.id })
    },
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validateInvoiceDraft(draft)
    if (err) return setError(err)
    setError(null)
    create.mutate(
      { cardName: draft.name, status: 'pendente', ...parseInvoiceDraft(draft) },
      {
        onSuccess: () => {
          setFormOpen(false)
          setDraft(emptyInvoiceDraft)
        },
      },
    )
  }

  const cardList = cards.data ?? []
  const activeGroups =
    cardFilter === 'all'
      ? cardList
          .map((card) => ({ card, rows: active.filter((r) => r.cardId === card.id) }))
          .filter((g) => g.rows.length > 0)
      : cardList
          .filter((c) => c.id === cardFilter)
          .map((card) => ({ card, rows: active.filter((r) => r.cardId === card.id) }))
          .filter((g) => g.rows.length > 0)
  const unlinked = cardFilter === 'all' ? active.filter((r) => !r.cardId) : []
  const hasActive = activeGroups.length > 0 || unlinked.length > 0

  return (
    <>
      <PageHeader
        title={
          <>
            Faturas <span className="text-sm font-normal text-muted">· a pagar</span>
          </>
        }
      >
        <Button onClick={() => setFormOpen(true)}>+ Nova fatura</Button>
      </PageHeader>

      {list.isLoading ? (
        <Card>
          <LoadingState />
        </Card>
      ) : (
        <>
          {rows.length > 0 ? (
            <InvoiceMonthHero rows={heroRows} month={month} onMonthChange={setMonth} today={today} />
          ) : null}
          <CardStrip
            selected={cardFilter}
            onSelect={setCardFilter}
            invoiceCount={rows.filter((r) => !closedOf(r)).length}
          />

          <div className="space-y-3.5">
            {activeGroups.map(({ card, rows: groupRows }) => (
              <Card key={card.id}>
                <div className="mb-2.5 flex items-center gap-2">
                  <BankLogo preset={card.bankPreset} size={24} />
                  <b className="text-[13.5px] text-foreground">{card.name}</b>
                </div>
                <InvoiceTable rows={groupRows} {...tableProps} />
              </Card>
            ))}
            {unlinked.length > 0 ? (
              <Card>
                <div className="mb-2.5 text-[10px] font-black uppercase tracking-[2.5px] text-muted">
                  Sem cartão
                </div>
                <InvoiceTable rows={unlinked} {...tableProps} />
              </Card>
            ) : null}
            {rows.length === 0 ? (
              <Card>
                <EmptyState
                  title="Nenhuma fatura"
                  hint="Registre parcelamentos de cartão com valor, parcelas e primeiro vencimento."
                />
              </Card>
            ) : !hasActive ? (
              <Card>
                <p className="text-xs text-muted">Nenhuma fatura ativa neste filtro.</p>
              </Card>
            ) : null}
            <ClosedInvoices rows={closed} showCard={cardFilter === 'all'} />
          </div>
        </>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent title="Nova fatura">
          <form onSubmit={handleSubmit}>
            <InvoiceFormFields draft={draft} onChange={setDraft} />
            {error ? <p className="mb-3 text-xs font-bold text-negative">{error}</p> : null}
            <Button type="submit" disabled={create.isPending} className="w-full">
              Salvar fatura
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <InstallmentPaymentDialog target={payingTarget} onClose={() => setPayingTarget(null)} />
    </>
  )
}
