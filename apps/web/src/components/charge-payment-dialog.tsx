'use client'

import { useEffect, useState } from 'react'
import { applyChargePayment, installmentTotals, toNumber } from '@pmf/core'
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

/** Registrar recebimento (parcial ou de uma parcela específica) de uma cobrança. */
export function ChargePaymentDialog({
  charge,
  initialAmount,
  installmentLabel,
  onClose,
}: {
  charge: ChargePaymentTarget | null
  initialAmount?: number
  installmentLabel?: string
  onClose: () => void
}) {
  const utils = trpc.useUtils()
  const open = charge !== null
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

  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setAmount(initialAmount ? initialAmount.toFixed(2).replace('.', ',') : '')
      setError(null)
    }
  }, [open, charge?.id, initialAmount])

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

  const title = installmentLabel
    ? `Recebimento de ${charge.debtorName} · ${installmentLabel}`
    : `Recebimento de ${charge.debtorName}`

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent title={title}>
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
      </DialogContent>
    </Dialog>
  )
}
