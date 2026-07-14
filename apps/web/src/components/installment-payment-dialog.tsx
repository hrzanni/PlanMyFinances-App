'use client'

import { useEffect, useRef, useState } from 'react'
import { formatDate } from '@pmf/core'
import { Button, Dialog, DialogContent, Field, Input, Label } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { money } from '@/lib/format'
import { rowInstallments } from '@/components/invoice-derive'

export interface PaymentTarget {
  invoiceId: string
  installmentNumber: number
}

type PaidStatus = 'paga' | 'pendente'
const toComma = (n: number) => n.toFixed(2).replace('.', ',')
const parseAmount = (v: string) => Number(v.replace(',', '.'))

/** Dialog de pagamento de parcela + toast da despesa criada; alvo derivado do cache. */
export function InstallmentPaymentDialog({
  target,
  onClose,
}: {
  target: PaymentTarget | null
  onClose: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const utils = trpc.useUtils()
  const list = trpc.invoices.list.useQuery()
  const row = target ? (list.data?.find((r) => r.id === target.invoiceId) ?? null) : null
  const st = row && target ? rowInstallments(row, today)[target.installmentNumber - 1] : undefined
  const per = row ? Number(row.amountPerInstallment) : 0

  const [status, setStatus] = useState<PaidStatus>('paga')
  const [amount, setAmount] = useState('')
  const [paidOn, setPaidOn] = useState(today)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; detail: string; paymentId: string } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!target || !st) return
    const payment = row?.payments.find((p) => p.installmentNumber === target.installmentNumber)
    setStatus('paga')
    setAmount(toComma(st.paid ? (st.amountPaid ?? per) : per))
    setPaidOn(payment ? String(payment.paidOn).slice(0, 10) : today)
    setError(null)
    // intencional: reidrata só quando o alvo muda (valores vêm do cache naquele momento)
  }, [target?.invoiceId, target?.installmentNumber])

  const invalidate = () => {
    utils.invoices.invalidate()
    utils.transactions.invalidate()
    utils.dashboard.invalidate()
    // a despesa gerada/removida muda o txCount dos tiles de cartão
    utils.cards.invalidate()
  }
  const dismissToast = () => {
    if (timer.current) clearTimeout(timer.current)
    setToast(null)
  }
  const register = trpc.invoices.registerPayment.useMutation({
    onSuccess: ({ payment, transaction }) => {
      invalidate()
      setToast({
        text: 'Despesa criada no Histórico',
        detail: `${money(transaction.value)} · "${transaction.description}" · ${row?.categoryName ?? 'sem categoria'} · ${row?.cardName ?? ''} · ${formatDate(String(transaction.date).slice(0, 10))}`,
        paymentId: payment.id,
      })
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setToast(null), 5000)
      onClose()
    },
    onError: (e) => setError(e.message),
  })
  const update = trpc.invoices.updatePayment.useMutation({
    onSuccess: () => {
      invalidate()
      onClose()
    },
    onError: (e) => setError(e.message),
  })
  const unregister = trpc.invoices.unregisterPayment.useMutation({ onSuccess: invalidate })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!row || !target || !st) return
    if (status === 'pendente') {
      if (st.paymentId) unregister.mutate({ paymentId: st.paymentId })
      onClose()
      return
    }
    const value = parseAmount(amount)
    if (!value || value <= 0) return setError('Informe o valor pago')
    setError(null)
    if (st.paid && st.paymentId) {
      update.mutate({ paymentId: st.paymentId, amount: value, paidOn })
    } else {
      register.mutate({ id: row.id, installmentNumber: target.installmentNumber, amount: value, paidOn })
    }
  }

  const pending = register.isPending || update.isPending
  const value = parseAmount(amount) || per
  const seg = (s: PaidStatus, label: string) => (
    <button
      type="button"
      onClick={() => setStatus(s)}
      className={`flex-1 py-2.5 text-[12.5px] font-bold ${
        status === s ? 'bg-foreground text-background' : 'bg-transparent text-muted'
      }`}
    >
      {label}
    </button>
  )

  return (
    <>
      <Dialog open={target !== null} onOpenChange={(v) => !v && onClose()}>
        {row && st && target ? (
          <DialogContent
            title={`Parcela ${target.installmentNumber} de ${row.totalInstallments} · ${row.description || row.cardName}`}
          >
            <p className="mb-4 text-xs text-muted">
              Vencimento {formatDate(st.dueDate)}
              {st.overdue ? <span className="font-bold text-negative"> · em atraso</span> : null}
            </p>
            <form onSubmit={handleSubmit}>
              <Field>
                <Label>Status</Label>
                <div className="flex overflow-hidden rounded-xl border border-line">
                  {seg('paga', 'Paga')}
                  {seg('pendente', 'Pendente')}
                </div>
              </Field>
              {status === 'paga' ? (
                <>
                  <Field>
                    <Label htmlFor="inst-amount">Valor pago (R$)</Label>
                    <Input
                      id="inst-amount"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <p className="mt-1.5 text-[11px] text-muted">
                      Sugerido: {money(per)} (valor da parcela). Ajuste se pagou diferente.
                    </p>
                  </Field>
                  <Field>
                    <Label htmlFor="inst-date">Data do pagamento</Label>
                    <Input
                      id="inst-date"
                      type="date"
                      value={paidOn}
                      onChange={(e) => setPaidOn(e.target.value)}
                    />
                  </Field>
                  <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-positive/25 bg-positive/[.08] px-3 py-2.5">
                    <span className="font-black text-positive">↳</span>
                    <span className="text-[11.5px] leading-relaxed text-body">
                      Ao salvar, uma <b className="text-foreground">despesa de {money(value)}</b>{' '}
                      {st.paid ? 'será atualizada' : 'será criada'} no Histórico:{' '}
                      &quot;{row.description || row.cardName} — parcela {target.installmentNumber}/
                      {row.totalInstallments}&quot; · categoria{' '}
                      <span className="font-bold text-positive">{row.categoryName ?? 'sem categoria'}</span> ·
                      cartão <b className="text-foreground">{row.cardName}</b>.
                    </span>
                  </div>
                </>
              ) : (
                <p className="mb-3 text-[11.5px] text-muted">
                  {st.paid
                    ? 'Ao salvar, o pagamento e a despesa vinculada serão removidos.'
                    : 'Esta parcela ainda não foi paga.'}
                </p>
              )}
              {error ? <p className="mb-3 text-xs font-bold text-negative">{error}</p> : null}
              <Button type="submit" disabled={pending} className="w-full">
                {status === 'pendente' ? 'Salvar' : st.paid ? 'Salvar' : 'Marcar como paga'}
              </Button>
            </form>
          </DialogContent>
        ) : null}
      </Dialog>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-[130] max-w-[380px] rounded-2xl border-l-4 border-positive bg-foreground px-4 py-3.5 text-background shadow-xl">
          <div className="flex items-center gap-1.5 text-[12.5px] font-black">
            <span className="text-positive">✓</span> {toast.text}
          </div>
          <div className="mt-1 text-[11.5px] tabular-nums leading-relaxed opacity-80">{toast.detail}</div>
          <button
            type="button"
            onClick={() => {
              unregister.mutate({ paymentId: toast.paymentId })
              dismissToast()
            }}
            className="mt-1.5 inline-block text-[11px] font-bold underline opacity-90"
          >
            desfazer
          </button>
        </div>
      ) : null}
    </>
  )
}
