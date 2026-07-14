'use client'

import { useState } from 'react'
import { Button, Card, Dialog, DialogContent, EmptyState, Field, Input, Label, LoadingState, Select } from '@pmf/ui-web'
import { trpc, type RouterOutputs } from '@/lib/trpc'
import { PageHeader } from '@/components/page-header'

type CategoryItem = RouterOutputs['categories']['list'][number]

function CategoryCard({ category }: { category: CategoryItem }) {
  const utils = trpc.useUtils()
  const invalidate = () => utils.categories.invalidate()
  const del = trpc.categories.delete.useMutation({ onSuccess: invalidate })
  const createSub = trpc.categories.createSub.useMutation({ onSuccess: invalidate })
  const delSub = trpc.categories.deleteSub.useMutation({ onSuccess: invalidate })
  const [subName, setSubName] = useState('')
  const [adding, setAdding] = useState(false)

  function handleAddSub(e: React.FormEvent) {
    e.preventDefault()
    // vazio = cancelar, igual ao blur
    if (!subName.trim()) {
      setSubName('')
      setAdding(false)
      return
    }
    createSub.mutate({ categoryId: category.id, name: subName.trim() })
    setSubName('')
    setAdding(false)
  }

  return (
    <Card>
      <div className="mb-2 flex items-center gap-2">
        <b className="flex-1 text-sm text-foreground">{category.name}</b>
        {category.isSystem ? (
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-bold uppercase text-muted">
            sistema
          </span>
        ) : (
          <button
            type="button"
            aria-label={`Excluir categoria ${category.name}`}
            className="text-xs text-muted hover:text-negative"
            onClick={() => {
              if (
                window.confirm(
                  `Excluir "${category.name}"? As subcategorias somem e as transações ficam "sem categoria".`,
                )
              ) {
                del.mutate({ id: category.id })
              }
            }}
          >
            🗑
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {category.subcategories.map((sub: CategoryItem['subcategories'][number]) => (
          <span
            key={sub.id}
            className="group inline-flex items-center gap-1 rounded-full border border-line bg-background px-2.5 py-1 text-xs text-body"
          >
            {sub.name}
            <button
              type="button"
              aria-label={`Excluir subcategoria ${sub.name}`}
              className="hidden text-muted hover:text-negative group-hover:inline"
              onClick={() => {
                if (window.confirm(`Excluir a subcategoria "${sub.name}"?`)) {
                  delSub.mutate({ id: sub.id })
                }
              }}
            >
              ✕
            </button>
          </span>
        ))}
        {category.isSystem ? null : adding ? (
          <form onSubmit={handleAddSub} className="inline-flex items-center gap-1">
            <input
              autoFocus
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              onBlur={() => !subName && setAdding(false)}
              placeholder="nome"
              className="w-24 rounded-full border border-info bg-surface px-2.5 py-1 text-xs text-foreground outline-none"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full border border-dashed border-line px-2.5 py-1 text-xs text-muted hover:border-info hover:text-info"
          >
            + sub
          </button>
        )}
      </div>
    </Card>
  )
}

export default function CategoriesPage() {
  const { data: categories, isLoading } = trpc.categories.list.useQuery()
  const utils = trpc.useUtils()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<'receita' | 'despesa'>('despesa')
  const [error, setError] = useState<string | null>(null)

  const create = trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.invalidate()
      setOpen(false)
      setName('')
    },
    onError: () => setError('Erro ao salvar. Tente novamente.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) return setError('Informe o nome')
    create.mutate({ name: name.trim(), type })
  }

  const expenses = (categories ?? []).filter((c) => c.type === 'despesa')
  const incomes = (categories ?? []).filter((c) => c.type === 'receita')

  return (
    <>
      <PageHeader
        title="Categorias"
        subtitle='Excluir uma categoria apaga as subcategorias e deixa as transações como "sem categoria".'
      >
        <Button onClick={() => setOpen(true)}>+ Nova categoria</Button>
      </PageHeader>

      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-negative">
            Despesas
          </div>
          {expenses.length > 0 ? (
            <div className="mb-6 grid gap-3 md:grid-cols-2">
              {expenses.map((c) => (
                <CategoryCard key={c.id} category={c} />
              ))}
            </div>
          ) : (
            <div className="mb-6">
              <EmptyState title="Nenhuma categoria de despesa" />
            </div>
          )}

          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-positive">
            Receitas
          </div>
          {incomes.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {incomes.map((c) => (
                <CategoryCard key={c.id} category={c} />
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhuma categoria de receita" />
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Nova categoria">
          <form onSubmit={handleSubmit}>
            <Field>
              <Label htmlFor="cat-name">Nome</Label>
              <Input id="cat-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field>
              <Label htmlFor="cat-type">Tipo</Label>
              <Select
                id="cat-type"
                value={type}
                onChange={(e) => setType(e.target.value as 'receita' | 'despesa')}
              >
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </Select>
            </Field>
            {error ? <p className="mb-3 text-xs font-bold text-negative">{error}</p> : null}
            <Button type="submit" disabled={create.isPending} className="w-full">
              {create.isPending ? 'Salvando…' : 'Criar categoria'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
