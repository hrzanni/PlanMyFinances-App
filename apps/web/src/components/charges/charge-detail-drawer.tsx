'use client'

import { useState } from 'react'
import {
  deriveChargeInstallments,
  installmentTotals,
  nextUnpaidChargeInstallment,
} from '@pmf/core'
import { Button, Drawer, DrawerContent } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { money } from '@/lib/format'
import { InstallmentsPanel } from '@/components/installments-panel'
import {
  ChargePaymentDialog,
  type ChargePaymentTarget,
} from '@/components/charge-payment-dialog'
import { ChargePaymentHistory } from './charge-payment-history'
import { toChargeState, type ChargeRow } from './charge-adapt'

const STATUS_ORDER = ['pendente', 'cobrado', 'pago'] as const
type ChargeStatus = (typeof STATUS_ORDER)[number]

interface PayingTarget {
  charge: ChargePaymentTarget
  initialAmount?: number
  installmentLabel?: string
}

function ActionsMenu({
  charge,
  onEdit,
  onSetStatus,
  onDelete,
}: {
  charge: ChargeRow
  onEdit: () => void
  onSetStatus: (status: ChargeStatus) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const otherStatuses = STATUS_ORDER.filter((s) => s !== charge.status)
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Ações da cobrança"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full px-2 py-1 text-lg leading-none text-muted hover:text-foreground"
      >
        ⋯
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-line bg-surface p-1 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onEdit()
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-foreground hover:bg-foreground/5"
            >
              Editar cobrança
            </button>
            {otherStatuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setOpen(false)
                  onSetStatus(status)
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-foreground hover:bg-foreground/5"
              >
                Marcar como {status}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-negative hover:bg-negative/5"
            >
              Excluir cobrança
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}

function ChargeDetailBody({
  charge,
  today,
  onEdit,
  onSetStatus,
  onDelete,
  onOpenPayment,
}: {
  charge: ChargeRow
  today: string
  onEdit: () => void
  onSetStatus: (status: ChargeStatus) => void
  onDelete: () => void
  onOpenPayment: (target: PayingTarget) => void
}) {
  const state = toChargeState(charge)
  const totals = installmentTotals(
    state.amountPerInstallment,
    state.totalInstallments,
    state.amountPaid,
  )
  const schedule = deriveChargeInstallments(state, today)
  const target: ChargePaymentTarget = {
    id: charge.id,
    debtorName: charge.debtorName,
    amountPerInstallment: charge.amountPerInstallment,
    totalInstallments: charge.totalInstallments,
    amountPaid: charge.amountPaid,
  }

  return (
    <DrawerContent title={charge.debtorName}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <h2 className="text-lg font-black tracking-tight text-foreground">{charge.debtorName}</h2>
        <ActionsMenu charge={charge} onEdit={onEdit} onSetStatus={onSetStatus} onDelete={onDelete} />
      </div>
      <div className="mb-5 text-2xl font-black tabular-nums text-foreground">
        {money(totals.total)}
      </div>
      <div className="flex flex-col gap-5">
        {schedule ? (
          <InstallmentsPanel
            installments={schedule}
            onOpenPayment={(n) =>
              onOpenPayment({
                charge: target,
                initialAmount: state.amountPerInstallment,
                installmentLabel: `Parcela ${n}`,
              })
            }
          />
        ) : (
          <p className="text-xs text-muted">
            Recebido {money(state.amountPaid)} de {money(totals.total)} · resta{' '}
            <span className="font-bold text-foreground">{money(totals.remaining)}</span>
          </p>
        )}
        <Button
          onClick={() =>
            onOpenPayment({
              charge: target,
              initialAmount: nextUnpaidChargeInstallment(state, today)?.amount,
            })
          }
          className="w-full"
        >
          Registrar recebimento
        </Button>
        <ChargePaymentHistory chargeId={charge.id} />
      </div>
    </DrawerContent>
  )
}

/** Gaveta de detalhe de cobrança: ações (⋯), parcelas ou fallback simples, recebimento e histórico. */
export function ChargeDetailDrawer({
  charge,
  today,
  onClose,
  onEdit,
}: {
  charge: ChargeRow | null
  today: string
  onClose: () => void
  onEdit: (charge: ChargeRow) => void
}) {
  const utils = trpc.useUtils()
  const invalidate = () => utils.charges.invalidate()
  const setStatus = trpc.charges.setStatus.useMutation({ onSuccess: invalidate })
  const del = trpc.charges.delete.useMutation({
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })
  const [payingTarget, setPayingTarget] = useState<PayingTarget | null>(null)

  return (
    <>
      <Drawer open={charge !== null} onOpenChange={(open) => !open && onClose()}>
        {charge ? (
          <ChargeDetailBody
            charge={charge}
            today={today}
            onEdit={() => onEdit(charge)}
            onSetStatus={(status) => setStatus.mutate({ id: charge.id, status })}
            onDelete={() => {
              if (window.confirm(`Excluir a cobrança de "${charge.debtorName}"?`)) {
                del.mutate({ id: charge.id })
              }
            }}
            onOpenPayment={setPayingTarget}
          />
        ) : null}
      </Drawer>

      <ChargePaymentDialog
        charge={payingTarget?.charge ?? null}
        initialAmount={payingTarget?.initialAmount}
        installmentLabel={payingTarget?.installmentLabel}
        onClose={() => setPayingTarget(null)}
      />
    </>
  )
}
