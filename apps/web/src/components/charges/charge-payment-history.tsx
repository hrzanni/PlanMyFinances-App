'use client'

import { formatDate } from '@pmf/core'
import { trpc } from '@/lib/trpc'
import { money } from '@/lib/format'

/** Histórico de recebimentos de uma cobrança + desfazer (extraído de ChargePaymentDialog). */
export function ChargePaymentHistory({ chargeId }: { chargeId: string }) {
  const utils = trpc.useUtils()
  const payments = trpc.charges.payments.useQuery({ id: chargeId })
  const unregister = trpc.charges.unregisterPayment.useMutation({
    onSuccess: () => {
      utils.charges.invalidate()
      utils.transactions.invalidate()
      utils.dashboard.invalidate()
    },
  })

  if (!payments.data || payments.data.length === 0) return null

  return (
    <div className="border-t border-dashed border-line pt-4">
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
  )
}
