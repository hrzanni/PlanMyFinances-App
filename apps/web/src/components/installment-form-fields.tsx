'use client'

import { Field, Input, Label } from '@pmf/ui-web'

export interface InstallmentDraft {
  name: string
  description: string
  amountPerInstallment: string
  totalInstallments: string
  amountPaid: string
  dueDate: string
}

export const emptyInstallmentDraft: InstallmentDraft = {
  name: '',
  description: '',
  amountPerInstallment: '',
  totalInstallments: '1',
  amountPaid: '0',
  dueDate: '',
}

/** Valida RN-004 no cliente: pago ≤ parcela × parcelas. Retorna erro ou null. */
export function validateInstallmentDraft(d: InstallmentDraft): string | null {
  const per = Number(d.amountPerInstallment.replace(',', '.'))
  const count = Number(d.totalInstallments)
  const paid = Number(d.amountPaid.replace(',', '.') || '0')
  if (!per || per <= 0) return 'Informe o valor da parcela'
  if (!count || count < 1) return 'Quantidade de parcelas deve ser ao menos 1'
  if (paid < 0) return 'Valor pago não pode ser negativo'
  if (Math.round(paid * 100) > Math.round(per * 100) * count)
    return 'Valor pago não pode exceder o total'
  return null
}

export function parseInstallmentDraft(d: InstallmentDraft) {
  return {
    description: d.description || undefined,
    amountPerInstallment: Number(d.amountPerInstallment.replace(',', '.')),
    totalInstallments: Number(d.totalInstallments),
    amountPaid: Number(d.amountPaid.replace(',', '.') || '0'),
    dueDate: d.dueDate || undefined,
  }
}

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
