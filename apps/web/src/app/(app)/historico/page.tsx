'use client'

import { Suspense, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button, Card, EmptyState, ErrorState, LoadingState, Select, Input, Table, Th } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { PageHeader } from '@/components/page-header'
import { TransactionForm, type TransactionItem } from '@/components/transaction-form'
import { TransactionTableRow } from '@/components/transaction-table-row'

/** Filtros persistidos na URL (FR-005): a query string é a fonte da verdade. */
function HistoryContent() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<TransactionItem | null>(null)

  const filters = {
    type: (params.get('tipo') as 'receita' | 'despesa') || undefined,
    categoryId: params.get('categoria') || undefined,
    subcategoryId: params.get('subcategoria') || undefined,
    folderId: params.get('pasta') || undefined,
    dateFrom: params.get('de') || undefined,
    dateTo: params.get('ate') || undefined,
  }

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    if (key === 'categoria') next.delete('subcategoria')
    router.replace(`${pathname}?${next.toString()}`)
  }

  const utils = trpc.useUtils()
  const { data: categories } = trpc.categories.list.useQuery()
  const { data: folders } = trpc.folders.list.useQuery()
  const list = trpc.transactions.list.useQuery({ ...filters, limit: 50 })
  const del = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      utils.transactions.invalidate()
      utils.dashboard.invalidate()
      utils.folders.invalidate()
    },
  })

  const category = categories?.find((c) => c.id === filters.categoryId)

  return (
    <>
      <PageHeader title="Histórico" subtitle="Filtros combinam entre si e ficam salvos na URL.">
        <Button
          onClick={() => {
            setEditingTx(null)
            setFormOpen(true)
          }}
        >
          + Nova transação
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="w-36">
          <Select
            aria-label="Tipo"
            value={filters.type ?? ''}
            onChange={(e) => setFilter('tipo', e.target.value)}
          >
            <option value="">Todos os tipos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
          </Select>
        </div>
        <div className="w-44">
          <Select
            aria-label="Categoria"
            value={filters.categoryId ?? ''}
            onChange={(e) => setFilter('categoria', e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-44">
          <Select
            aria-label="Subcategoria"
            value={filters.subcategoryId ?? ''}
            onChange={(e) => setFilter('subcategoria', e.target.value)}
            disabled={!category || category.subcategories.length === 0}
          >
            <option value="">Todas as subcategorias</option>
            {(category?.subcategories ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Input
            aria-label="De"
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) => setFilter('de', e.target.value)}
          />
        </div>
        <div className="w-40">
          <Input
            aria-label="Até"
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) => setFilter('ate', e.target.value)}
          />
        </div>
        {folders && folders.length > 0 ? (
          <div className="w-44">
            <Select
              aria-label="Pasta"
              value={filters.folderId ?? ''}
              onChange={(e) => setFilter('pasta', e.target.value)}
            >
              <option value="">Todas as pastas</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        {params.size > 0 ? (
          <Button variant="link" size="sm" onClick={() => router.replace(pathname)}>
            Limpar filtros
          </Button>
        ) : null}
      </div>

      <Card>
        {list.isLoading ? (
          <LoadingState />
        ) : list.isError ? (
          <ErrorState onRetry={() => list.refetch()} />
        ) : list.data && list.data.items.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <Th>Data</Th>
                <Th>Descrição</Th>
                <Th>Categoria</Th>
                <Th>Subcategoria</Th>
                <Th>Cartão</Th>
                <Th>Pasta</Th>
                <Th>Origem</Th>
                <Th numeric>Valor</Th>
                <Th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((tx) => (
                <TransactionTableRow
                  key={tx.id}
                  tx={tx}
                  onEdit={() => {
                    setEditingTx(tx)
                    setFormOpen(true)
                  }}
                  onDelete={() => {
                    if (window.confirm('Excluir esta transação?')) del.mutate({ id: tx.id })
                  }}
                />
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            title="Nenhuma transação com esses filtros"
            hint="Ajuste os filtros ou crie uma nova transação."
          />
        )}
      </Card>

      <TransactionForm
        open={formOpen}
        editing={editingTx}
        onOpenChange={(next) => {
          setFormOpen(next)
          if (!next) setEditingTx(null)
        }}
      />
    </>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HistoryContent />
    </Suspense>
  )
}
