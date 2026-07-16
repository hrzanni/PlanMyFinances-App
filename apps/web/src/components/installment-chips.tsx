'use client'

import type { InstallmentState } from '@pmf/core'

function chipClass(st: InstallmentState, isNext: boolean, interactive: boolean): string {
  const tone = st.paid
    ? 'bg-positive/[.14] border-positive/35 text-positive'
    : st.overdue
      ? 'border-negative text-negative shadow-[0_0_0_1px_rgb(var(--negative)/0.4)]'
      : isNext
        ? 'border-attention text-attention shadow-[0_0_0_1px_rgb(var(--attention)/0.4)]'
        : 'border-line text-muted'
  return `inline-flex h-8 min-w-8 items-center justify-center gap-0.5 rounded-[10px] border bg-surface px-1 text-[11px] font-black transition-transform ${
    interactive ? 'hover:-translate-y-0.5' : ''
  } ${tone}`
}

/**
 * Fileira de chips numerados de parcela. Extraído de InstallmentsPanel (Faturas) pra reuso
 * no preview do card de Cobranças. Sem `onSelect` renderiza `div` (não `button`) — evita
 * botão aninhado dentro do card, que também é um `button`.
 */
export function InstallmentChips({
  installments,
  onSelect,
}: {
  installments: InstallmentState[]
  onSelect?: (n: number) => void
}) {
  const firstUnpaid = installments.find((s) => !s.paid)?.number ?? -1

  return (
    <div className="mb-3 flex flex-wrap gap-[7px]">
      {installments.map((st) => {
        const className = chipClass(st, st.number === firstUnpaid, !!onSelect)
        const content = (
          <>
            {st.number}
            {st.paid ? <span className="text-[8px]">✓</span> : null}
          </>
        )
        return onSelect ? (
          <button
            key={st.number}
            type="button"
            title={`Parcela ${st.number} · ${st.dueDate}`}
            onClick={() => onSelect(st.number)}
            className={className}
          >
            {content}
          </button>
        ) : (
          <div key={st.number} title={`Parcela ${st.number} · ${st.dueDate}`} className={className}>
            {content}
          </div>
        )
      })}
    </div>
  )
}
