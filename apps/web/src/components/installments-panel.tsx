'use client'

import { formatDate, type InstallmentState } from '@pmf/core'
import { money } from '@/lib/format'
import { InstallmentChips } from '@/components/installment-chips'

/** Chevron SVG rotativo — nunca o glifo ▶ (regra do mockup). */
export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function StatusPill({ st }: { st: InstallmentState }) {
  if (st.paid)
    return <span className="rounded-full bg-positive/10 px-2.5 py-1 text-[10px] font-bold text-positive">paga</span>
  if (st.overdue)
    return <span className="rounded-full bg-negative/10 px-2.5 py-1 text-[10px] font-bold text-negative">em atraso</span>
  return <span className="rounded-full bg-attention/10 px-2.5 py-1 text-[10px] font-bold text-attention">pendente</span>
}

/** Painel de parcelas de UMA fatura: chips numerados + tabela com registrar/editar. */
export function InstallmentsPanel({
  installments,
  onOpenPayment,
}: {
  installments: InstallmentState[]
  onOpenPayment: (n: number) => void
}) {
  const paidCount = installments.filter((s) => s.paid).length
  const firstUnpaid = installments.find((s) => !s.paid)?.number ?? -1

  return (
    <div className="my-1 rounded-xl bg-foreground/[.035] px-4 py-3.5">
      <div className="mb-2.5 text-[10px] font-black uppercase tracking-[2.5px] text-muted">
        Parcelas · {paidCount} de {installments.length} pagas
      </div>
      <InstallmentChips installments={installments} onSelect={onOpenPayment} />
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {['Parcela', 'Vencimento', 'Valor pago', 'Status', ''].map((h, i) => (
              <th
                key={i}
                className="border-b border-line px-2 py-1.5 text-left text-[9.5px] font-bold uppercase tracking-wider text-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {installments.map((st) => (
            <tr key={st.number} className="last:[&>td]:border-0">
              <td className="border-b border-line px-2 py-1.5 font-bold text-foreground">
                Parcela {st.number}
              </td>
              <td className="border-b border-line px-2 py-1.5 tabular-nums text-body">
                {formatDate(st.dueDate)}
              </td>
              <td className="border-b border-line px-2 py-1.5 tabular-nums text-body">
                {st.paid ? money(st.amountPaid) : '—'}
              </td>
              <td className="border-b border-line px-2 py-1.5">
                <StatusPill st={st} />
              </td>
              <td className="border-b border-line px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => onOpenPayment(st.number)}
                  className={`text-[11px] underline ${
                    st.number === firstUnpaid ? 'font-bold text-foreground' : 'text-muted'
                  }`}
                >
                  {st.paid ? 'editar' : 'registrar pagamento'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
