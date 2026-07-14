'use client'

import type { InstallmentDraft } from '@pmf/core'
import { Field, Input, Label } from '@pmf/ui-web'

/** Campos do formulário de cobrança (parcela, parcelas, recebido, vencimento). */
export function ChargeFormFields({
  draft,
  onChange,
}: {
  draft: InstallmentDraft
  onChange: (draft: InstallmentDraft) => void
}) {
  const set = (patch: Partial<InstallmentDraft>) => onChange({ ...draft, ...patch })
  return (
    <>
      <Field>
        <Label htmlFor="charge-name">Devedor</Label>
        <Input
          id="charge-name"
          required
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="charge-desc">Descrição (opcional)</Label>
        <Input
          id="charge-desc"
          value={draft.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <Label htmlFor="charge-per">Valor da parcela (R$)</Label>
          <Input
            id="charge-per"
            inputMode="decimal"
            required
            placeholder="0,00"
            value={draft.amountPerInstallment}
            onChange={(e) => set({ amountPerInstallment: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="charge-count">Parcelas</Label>
          <Input
            id="charge-count"
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
          <Label htmlFor="charge-paid">Já recebido (R$)</Label>
          <Input
            id="charge-paid"
            inputMode="decimal"
            value={draft.amountPaid}
            onChange={(e) => set({ amountPaid: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="charge-due">Vencimento (opcional)</Label>
          <Input
            id="charge-due"
            type="date"
            value={draft.dueDate}
            onChange={(e) => set({ dueDate: e.target.value })}
          />
        </Field>
      </div>
    </>
  )
}
