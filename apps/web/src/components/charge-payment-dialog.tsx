'use client'

import { useState } from 'react'
import { applyChargePayment, formatDate, installmentTotals, toNumber } from '@pmf/core'
import { Button, Dialog, DialogContent, Field, Input, Label } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { money } from '@/lib/format'

export interface ChargePaymentTarget {
  id: string
  debtorName: string
  amountPerInstallment: string
  totalInstallments: number
  amountPaid: string
}

/** Registrar recebimento parcial de cobrança + histórico com desfazer (fase 8.1). */
export function ChargePaymentDialog({
  charge,
  onClose,
}: {
  charge: ChargePaymentTarget | null
  onClose: () => void
}) {
  const utils = trpc.useUtils()
  const open = charge !== null
  const payments = trpc.charges.payments.useQuery(
    { id: charge?.id ?? '' },
    { enabled: open },
  )
  const invalidate = () => {
    utils.charges.invalidate()
    utils.transactions.invalidate()
    utils.dashboard.invalidate()
  }
  const register = trpc.charges.registerPayment.useMutation({
    onSuccess: () => {
      invalidate()
      setAmount('')
      setError(null)
    },
    onError: (err) => setError(err.message),
  })
  const unregister = trpc.charges.unregisterPayment.useMutation({ onSuccess: invalidate })

  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!charge) return null

  const totals = installmentTotals(
    toNumber(charge.amountPerInstallment),
    charge.totalInstallments,
    toNumber(charge.amountPaid),
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!charge) return
    const value = Number(amount.replace(',', '.'))
    if (!value || value <= 0) return setError('Informe o valor recebido')
    const applied = applyChargePayment(
      toNumber(charge.amountPerInstallment),
      charge.totalInstallments,
      toNumber(charge.amountPaid),
      value,
    )
    if (!applied) return setError('Valor recebido não pode exceder o restante')
    setError(null)
    register.mutate({ id: charge.id, amount: value })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent title={`Recebimento de ${charge.debtorName}`}>
        <p className="mb-3 text-xs text-muted">
          Recebido {money(charge.amountPaid)} de {money(totals.total)} · resta{' '}
          <span className="font-bold text-foreground">{money(totals.remaining)}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="charge-payment-amount">Valor recebido agora (R$)</Label>
            <Input
              id="charge-payment-amount"
              inputMode="decimal"
              required
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          {error ? <p className="mb-3 text-xs font-bold text-negative">{error}</p> : null}
          <Button
            type="submit"
            disabled={register.isPending || totals.remaining <= 0}
            className="w-full"
          >
            Registrar recebimento
          </Button>
        </form>

        {payments.data && payments.data.length > 0 ? (
          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-2 text-xs font-bold text-muted">Histórico de recebimentos</p>
            <ul className="space-y-1">
              {payments.data.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-xs">
                  <span>
                    {formatDate(String(p.createdAt).slice(0, 10))} ·{' '}
                    <span className="font-bold text-positive">{money(p.amount)}</span>
                  </span>
                  <button
                    type="button"
                    className="text-muted underline hover:text-negative"
                    disabled={unregister.isPending}
                    onClick={() => unregister.mutate({ paymentId: p.id })}
                  >
                    desfazer
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
