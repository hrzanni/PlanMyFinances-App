import { Badge, type BadgeTone } from '@pmf/ui-web'
import {
  chargeEffectiveState,
  deriveChargeInstallments,
  formatDate,
  installmentTotals,
  type ChargeEffectiveState,
} from '@pmf/core'
import { money } from '@/lib/format'
import { InstallmentChips } from '@/components/installment-chips'
import { toChargeState, type ChargeRow } from './charge-adapt'

const stateTone: Record<ChargeEffectiveState, BadgeTone> = {
  pago: 'paid',
  atrasada: 'late',
  cobrado: 'info',
  pendente: 'pending',
}

/** Card do grid de Cobranças: sem ações (edição/status/exclusão ficam na gaveta). */
export function ChargeCard({
  charge,
  today,
  style,
  onOpen,
}: {
  charge: ChargeRow
  today: string
  style?: React.CSSProperties
  onOpen: () => void
}) {
  const state = toChargeState(charge)
  const effective = chargeEffectiveState(state, today)
  const totals = installmentTotals(
    state.amountPerInstallment,
    state.totalInstallments,
    state.amountPaid,
  )
  const schedule = deriveChargeInstallments(state, today)
  const paidCount = schedule?.filter((s) => s.paid).length ?? 0
  const pct = totals.total > 0 ? Math.round((state.amountPaid / totals.total) * 100) : 0

  return (
    <button
      type="button"
      onClick={onOpen}
      style={style}
      className="animate-fade-slide-up rounded-2xl border border-line bg-surface p-4 text-left shadow-sm transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-sm font-bold text-foreground">{charge.debtorName}</span>
        <Badge tone={stateTone[effective]}>{effective}</Badge>
      </div>
      {charge.description ? (
        <div className="mt-0.5 truncate text-xs text-muted">{charge.description}</div>
      ) : null}
      <div className="mt-3 flex items-center gap-2">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <span className="block h-full rounded-full bg-positive" style={{ width: `${pct}%` }} />
        </span>
        <span className="whitespace-nowrap text-xs font-bold tabular-nums text-foreground">
          {pct}%
        </span>
      </div>
      <div className="mt-1.5 text-xs text-muted">
        {schedule
          ? `${paidCount} de ${state.totalInstallments} parcelas`
          : `${money(state.amountPaid)} recebido · ${money(totals.remaining)} restante`}
      </div>
      {schedule ? (
        <div className="mt-2.5">
          <InstallmentChips installments={schedule} />
        </div>
      ) : null}
      <div className="mt-1 border-t border-dashed border-line pt-2 text-xs text-muted">
        {effective === 'pago'
          ? 'Quitada'
          : state.dueDate
            ? `Vence ${formatDate(state.dueDate)}`
            : 'Sem vencimento definido'}
      </div>
    </button>
  )
}
