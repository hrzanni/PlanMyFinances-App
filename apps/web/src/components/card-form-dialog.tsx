'use client'

import { useEffect, useState } from 'react'
import { BANK_PRESETS, bankPresetInfo, type BankPresetKey } from '@pmf/core'
import { Button, Dialog, DialogContent, Field, Input, Label } from '@pmf/ui-web'
import { trpc, type RouterOutputs } from '@/lib/trpc'
import { BankLogo } from '@/components/bank-logo'

export type CardItem = RouterOutputs['cards']['list'][number]

/** Criar/editar cartão com seleção de banco preset e logo (fase 8.2). */
export function CardFormDialog({
  open,
  editing,
  onClose,
}: {
  open: boolean
  editing: CardItem | null
  onClose: () => void
}) {
  const utils = trpc.useUtils()
  const [name, setName] = useState('')
  const [preset, setPreset] = useState<BankPresetKey>('nubank')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      setPreset((editing?.bankPreset as BankPresetKey) ?? 'nubank')
      setError(null)
    }
  }, [open, editing])

  const onSuccess = () => {
    utils.cards.invalidate()
    onClose()
  }
  const onError = () => setError('Erro ao salvar. Tente novamente.')
  const create = trpc.cards.create.useMutation({ onSuccess, onError })
  const update = trpc.cards.update.useMutation({ onSuccess, onError })
  const isPending = create.isPending || update.isPending

  function selectPreset(key: BankPresetKey) {
    setPreset(key)
    // preencher o nome com o banco quando o usuário ainda não digitou nada
    if (!name.trim() || BANK_PRESETS.some((b) => b.label === name)) {
      setName(key === 'outro' ? '' : bankPresetInfo(key).label)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) return setError('Informe o nome do cartão')
    if (editing) {
      update.mutate({ id: editing.id, name: name.trim(), bankPreset: preset })
    } else {
      create.mutate({ name: name.trim(), bankPreset: preset })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent title={editing ? 'Editar cartão' : 'Novo cartão'}>
        <form onSubmit={handleSubmit}>
          <Field>
            <Label>Banco</Label>
            <div className="flex flex-wrap gap-2">
              {BANK_PRESETS.map((bank) => (
                <button
                  key={bank.key}
                  type="button"
                  onClick={() => selectPreset(bank.key)}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${
                    preset === bank.key
                      ? 'border-foreground text-foreground'
                      : 'border-line text-muted hover:border-foreground/40'
                  }`}
                >
                  <BankLogo preset={bank.key} size={20} />
                  {bank.label}
                </button>
              ))}
            </div>
          </Field>
          <Field>
            <Label htmlFor="card-name">Nome do cartão</Label>
            <Input
              id="card-name"
              required
              placeholder="ex.: Nubank do Hugo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          {error ? <p className="mb-3 text-xs font-bold text-negative">{error}</p> : null}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Salvando…' : editing ? 'Salvar cartão' : 'Criar cartão'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
