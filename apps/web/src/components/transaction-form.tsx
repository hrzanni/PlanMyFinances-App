'use client'

import { useMemo, useState } from 'react'
import { Button, Dialog, DialogContent, Field, Input, Label, Select } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Formulário de transação (FR-001/002/111): categoria filtrada por tipo, pasta opcional. */
export function TransactionForm({ open, onOpenChange }: Props) {
  const utils = trpc.useUtils()
  const { data: categories } = trpc.categories.list.useQuery(undefined, { enabled: open })
  const { data: folders } = trpc.folders.list.useQuery(undefined, { enabled: open })

  const [type, setType] = useState<'receita' | 'despesa'>('despesa')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [folderId, setFolderId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const typeCategories = useMemo(
    () => (categories ?? []).filter((c) => c.type === type),
    [categories, type],
  )
  const subcategories = useMemo(
    () => typeCategories.find((c) => c.id === categoryId)?.subcategories ?? [],
    [typeCategories, categoryId],
  )
  const activeFolders = useMemo(
    () => (folders ?? []).filter((f) => f.status === 'active'),
    [folders],
  )

  const create = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.invalidate()
      utils.dashboard.invalidate()
      utils.folders.invalidate()
      onOpenChange(false)
      setValue('')
      setDescription('')
    },
    onError: () => setError('Erro ao salvar. Tente novamente.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const parsed = Number(value.replace(',', '.'))
    if (!parsed || parsed <= 0) {
      setError('Informe um valor maior que zero')
      return
    }
    create.mutate({
      type,
      value: parsed,
      date,
      description: description || undefined,
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      folderId: folderId || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Nova transação">
        <form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="tx-type">Tipo</Label>
            <Select
              id="tx-type"
              value={type}
              onChange={(e) => {
                setType(e.target.value as 'receita' | 'despesa')
                setCategoryId('')
                setSubcategoryId('')
              }}
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label htmlFor="tx-value">Valor (R$)</Label>
              <Input
                id="tx-value"
                inputMode="decimal"
                placeholder="0,00"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor="tx-date">Data</Label>
              <Input
                id="tx-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </div>
          <Field>
            <Label htmlFor="tx-desc">Descrição (opcional)</Label>
            <Input
              id="tx-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label htmlFor="tx-cat">Categoria</Label>
              <Select
                id="tx-cat"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value)
                  setSubcategoryId('')
                }}
              >
                <option value="">Sem categoria</option>
                {typeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="tx-sub">Subcategoria</Label>
              <Select
                id="tx-sub"
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                disabled={subcategories.length === 0}
              >
                <option value="">—</option>
                {subcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field>
            <Label htmlFor="tx-folder">Pasta (opcional)</Label>
            <Select id="tx-folder" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
              <option value="">Nenhuma</option>
              {activeFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.icon ? `${f.icon} ` : ''}
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
          {error ? <p className="mb-3 text-xs font-bold text-negative">{error}</p> : null}
          <Button type="submit" disabled={create.isPending} className="w-full">
            {create.isPending ? 'Salvando…' : 'Salvar transação'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
