'use client'

import { useState } from 'react'
import { bankPresetInfo } from '@pmf/core'
import { trpc } from '@/lib/trpc'
import { showErrorToast } from '@/lib/toast'
import { BankLogo } from '@/components/bank-logo'
import { CardFormDialog, type CardItem } from '@/components/card-form-dialog'

const tileBase =
  'flex flex-none items-center gap-2.5 rounded-[14px] border bg-surface px-3 py-2.5 transition-all hover:-translate-y-px hover:shadow-md'

/** Faixa-filtro de cartões: "Todos" + tiles com editar/excluir + "+ Cartão" (reusa CardFormDialog). */
export function CardStrip({
  selected,
  onSelect,
  invoiceCount,
}: {
  selected: string | 'all'
  onSelect: (id: string | 'all') => void
  invoiceCount: number
}) {
  const utils = trpc.useUtils()
  const cards = trpc.cards.list.useQuery()
  const del = trpc.cards.delete.useMutation({
    onSuccess: () => utils.cards.invalidate(),
    onError: (error) => {
      showErrorToast(
        error.data?.code === 'CONFLICT'
          ? error.message
          : 'Não foi possível excluir o cartão. Tente novamente.',
      )
    },
  })

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CardItem | null>(null)

  const list = cards.data ?? []
  const totalTx = list.reduce((s, c) => s + c.txCount, 0)

  return (
    <>
      <div className="mb-4 flex gap-2.5 overflow-x-auto px-0.5 pb-1.5">
        <button
          type="button"
          onClick={() => onSelect('all')}
          className={`${tileBase} min-w-[190px] text-left ${
            selected === 'all' ? 'border-foreground shadow-[0_0_0_1.5px_rgb(var(--foreground))]' : 'border-line'
          }`}
        >
          <BankLogo preset="outro" size={34} />
          <span>
            <span className="block text-[13px] font-bold text-foreground">Todos os cartões</span>
            <span className="block text-[11px] text-muted">
              {totalTx} transações · {invoiceCount} faturas ativas
            </span>
          </span>
        </button>

        {list.map((card) => (
          <button
            type="button"
            key={card.id}
            onClick={() => onSelect(card.id)}
            className={`${tileBase} min-w-[190px] text-left ${
              selected === card.id
                ? 'border-foreground shadow-[0_0_0_1.5px_rgb(var(--foreground))]'
                : 'border-line'
            }`}
          >
            <BankLogo preset={card.bankPreset} size={34} />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold text-foreground">{card.name}</span>
              <span className="block text-[11px] text-muted">
                {bankPresetInfo(card.bankPreset).label} · {card.txCount}{' '}
                {card.txCount === 1 ? 'transação' : 'transações'}
              </span>
            </span>
            <span className="ml-auto flex items-center gap-2">
              <span
                role="button"
                tabIndex={0}
                className="text-[11px] text-muted underline hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditing(card)
                  setOpen(true)
                }}
              >
                editar
              </span>
              <span
                role="button"
                tabIndex={0}
                aria-label={`Excluir cartão ${card.name}`}
                className="text-[11px] text-muted hover:text-negative"
                onClick={(e) => {
                  e.stopPropagation()
                  if (
                    window.confirm(
                      `Excluir o cartão "${card.name}"? Transações dele ficam sem cartão. Não é possível excluir um cartão com faturas vinculadas.`,
                    )
                  ) {
                    del.mutate(
                      { id: card.id },
                      { onSuccess: () => selected === card.id && onSelect('all') },
                    )
                  }
                }}
              >
                🗑
              </span>
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className="flex min-w-[116px] flex-none items-center justify-center rounded-[14px] border border-dashed border-line px-3 py-2.5 text-[13px] font-bold text-muted transition-all hover:-translate-y-px hover:shadow-md"
        >
          + Cartão
        </button>
      </div>

      <CardFormDialog open={open} editing={editing} onClose={() => setOpen(false)} />
    </>
  )
}
