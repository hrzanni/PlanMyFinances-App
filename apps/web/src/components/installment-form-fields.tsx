'use client'

import type { InstallmentDraft } from '@pmf/core'
import { Field, Input, Label } from '@pmf/ui-web'

/** Campos comuns de cobrança/fatura (parcela, parcelas, pago, vencimento). */
export function InstallmentFormFields({
  draft,
  nameLabel,
  onChange,
}: {
  draft: InstallmentDraft
  nameLabel: string
  onChange: (draft: InstallmentDraft) => void
}) {
  const set = (patch: Partial<InstallmentDraft>) => onChange({ ...draft, ...patch })
  return (
    <>
      <Field>
        <Label htmlFor="inst-name">{nameLabel}</Label>
        <Input
          id="inst-name"
          required
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="inst-desc">Descrição (opcional)</Label>
        <Input
          id="inst-desc"
          value={draft.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <Label htmlFor="inst-per">Valor da parcela (R$)</Label>
          <Input
            id="inst-per"
            inputMode="decimal"
            required
            placeholder="0,00"
            value={draft.amountPerInstallment}
            onChange={(e) => set({ amountPerInstallment: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="inst-count">Parcelas</Label>
          <Input
            id="inst-count"
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
          <Label htmlFor="inst-paid">Já pago/recebido (R$)</Label>
          <Input
            id="inst-paid"
            inputMode="decimal"
            value={draft.amountPaid}
            onChange={(e) => set({ amountPaid: e.target.value })}
          />
        </Field>
        <Field>
          <Label htmlFor="inst-due">Vencimento (opcional)</Label>
          <Input
            id="inst-due"
            type="date"
            value={draft.dueDate}
            onChange={(e) => set({ dueDate: e.target.value })}
          />
        </Field>
      </div>
    </>
  )
}
