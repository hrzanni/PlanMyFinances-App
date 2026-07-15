'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Dialog, DialogContent, Field, Input, Label, Select } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'

export interface EditableFixedExpense {
  id: string
  name: string
  amount: string
  dueDay: number
  categoryId: string | null
  type: 'despesa' | 'receita'
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: EditableFixedExpense | null
}

/** Criar/editar fixo (despesa ou receita). Ao editar valor, vale do mês vigente em diante (FR-105). */
export function FixedExpenseForm({ open, onOpenChange, editing }: Props) {
  const utils = trpc.useUtils()
  const { data: categories } = trpc.categories.list.useQuery(undefined, { enabled: open })

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDay, setDueDay] = useState('5')
  const [type, setType] = useState<'despesa' | 'receita'>('despesa')
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const filteredCategories = useMemo(
    () => (categories ?? []).filter((c) => c.type === type),
    [categories, type],
  )

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      setAmount(editing ? String(Number(editing.amount)).replace('.', ',') : '')
      setDueDay(String(editing?.dueDay ?? 5))
      setType(editing?.type ?? 'despesa')
      setCategoryId(editing?.categoryId ?? '')
      setError(null)
    }
  }, [open, editing])

  function selectType(next: 'despesa' | 'receita') {
    setType(next)
    setCategoryId('')
  }

  const onDone = () => {
    utils.fixedExpenses.invalidate()
    onOpenChange(false)
  }
  const create = trpc.fixedExpenses.create.useMutation({
    onSuccess: onDone,
    onError: () => setError('Erro ao salvar. Tente novamente.'),
  })
  const update = trpc.fixedExpenses.update.useMutation({
    onSuccess: onDone,
    onError: () => setError('Erro ao salvar. Tente novamente.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const parsed = Number(amount.replace(',', '.'))
    const day = Number(dueDay)
    if (!parsed || parsed <= 0) return setError('Informe um valor maior que zero')
    if (!day || day < 1 || day > 31) return setError('Dia de vencimento entre 1 e 31')

    const payload = {
      name,
      amount: parsed,
      dueDay: day,
      type,
      categoryId: categoryId || undefined,
    }
    if (editing) update.mutate({ id: editing.id, ...payload })
    else create.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={editing ? 'Editar fixo' : 'Novo fixo'}
        description={
          editing
            ? 'Mudança de valor vale do mês vigente em diante; meses já pagos guardam o valor da época.'
            : undefined
        }
      >
        <form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="fe-name">Nome</Label>
            <Input
              id="fe-name"
              required
              placeholder="Aluguel, IPTU, Netflix…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor="fe-type">Tipo</Label>
            <Select
              id="fe-type"
              value={type}
              onChange={(e) => selectType(e.target.value as 'despesa' | 'receita')}
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label htmlFor="fe-amount">Valor mensal (R$)</Label>
              <Input
                id="fe-amount"
                inputMode="decimal"
                placeholder="0,00"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor="fe-due">Dia do vencimento</Label>
              <Input
                id="fe-due"
                type="number"
                min={1}
                max={31}
                required
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </Field>
          </div>
          <Field>
            <Label htmlFor="fe-cat">
              Categoria (para a {type === 'receita' ? 'receita' : 'despesa'} gerada)
            </Label>
            <Select
              id="fe-cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Sem categoria</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          {error ? <p className="mb-3 text-xs font-bold text-negative">{error}</p> : null}
          <Button type="submit" disabled={create.isPending || update.isPending} className="w-full">
            {create.isPending || update.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
