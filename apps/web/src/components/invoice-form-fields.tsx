'use client'

import type { InvoiceDraft } from '@pmf/core'
import { Field, Input, Label, Select } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'

/** Campos do formulário de fatura v2 (cartão, categoria, primeiro vencimento). */
export function InvoiceFormFields({
  draft,
  onChange,
}: {
  draft: InvoiceDraft
  onChange: (draft: InvoiceDraft) => void
}) {
  const cards = trpc.cards.list.useQuery()
  const categories = trpc.categories.list.useQuery()
  const expenseCats = (categories.data ?? []).filter((c) => c.type === 'despesa')
  const set = (patch: Partial<InvoiceDraft>) => onChange({ ...draft, ...patch })

  function selectCard(id: string) {
    const card = (cards.data ?? []).find((c) => c.id === id)
    set({ cardId: id, name: card ? card.name : draft.name })
  }

  return (
    <>
      <Field>
        <Label htmlFor="invoice-card">Cartão cadastrado (opcional)</Label>
        <Select id="invoice-card" value={draft.cardId} onChange={(e) => selectCard(e.target.value)}>
          <option value="">Nenhum</option>
          {(cards.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field>
        <Label htmlFor="invoice-name">Cartão</Label>
        <Input
          id="invoice-name"
          required
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="invoice-desc">Descrição (opcional)</Label>
        <Input
          id="invoice-desc"
          value={draft.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <Label htmlFor="invoice-per">Valor da parcela (R$)</Label>
          <Input
            id="invoice-per"
            inputMode="decimal"
            required
            placeholder="0,00"
            value={draft.amountPerInstallment}
            onChange={(e) => set({ amountPerInstallment: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="invoice-count">Parcelas</Label>
          <Input
            id="invoice-count"
            type="number"
            min={1}
            required
            value={draft.totalInstallments}
            onChange={(e) => set({ totalInstallments: e.target.value })}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <Label htmlFor="invoice-due">Primeiro vencimento</Label>
          <Input
            id="invoice-due"
            type="date"
            required
            value={draft.firstDueDate}
            onChange={(e) => set({ firstDueDate: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="invoice-cat">Categoria (opcional)</Label>
          <Select
            id="invoice-cat"
            value={draft.categoryId}
            onChange={(e) => set({ categoryId: e.target.value })}
          >
            <option value="">Nenhuma</option>
            {expenseCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </>
  )
}
