'use client'

import { useState } from 'react'
import { formatDate } from '@pmf/core'
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  EmptyState,
  Field,
  Input,
  Label,
  LoadingState,
  Table,
  Td,
  Th,
} from '@pmf/ui-web'
import { trpc, type RouterOutputs } from '@/lib/trpc'
import { money } from '@/lib/format'
import { PageHeader } from '@/components/page-header'

type FolderRow = RouterOutputs['folders']['list'][number]

/** Card de pasta: total gasto + transações dentro do próprio card (FR-112). */
function FolderCard({ folder }: { folder: FolderRow }) {
  const [expanded, setExpanded] = useState(false)
  const utils = trpc.useUtils()
  const txs = trpc.transactions.list.useQuery(
    { folderId: folder.id, limit: 10 },
    { enabled: expanded },
  )
  const archive = trpc.folders.update.useMutation({ onSuccess: () => utils.folders.invalidate() })
  const del = trpc.folders.delete.useMutation({
    onSuccess: () => {
      utils.folders.invalidate()
      utils.transactions.invalidate()
    },
  })
  const archived = folder.status === 'archived'

  return (
    <Card>
      <div className="flex items-center gap-2">
        <h3 className="flex-1 text-sm font-bold text-foreground">
          {folder.icon ? `${folder.icon} ` : ''}
          {folder.name}
        </h3>
        <Badge tone={archived ? 'neutral' : 'info'}>{archived ? 'arquivada' : 'ativa'}</Badge>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-muted hover:text-foreground"
        >
          {expanded ? 'recolher ▴' : 'expandir ▾'}
        </button>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-black tabular-nums text-foreground">
          {money(folder.totalSpent)}
        </span>
        <span className="text-xs text-muted">
          total gasto · {folder.txCount} transaç{folder.txCount === 1 ? 'ão' : 'ões'}
        </span>
      </div>

      {expanded ? (
        <div className="mt-3 border-t border-line pt-3">
          {txs.isLoading ? (
            <LoadingState />
          ) : txs.data && txs.data.items.length > 0 ? (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Data</Th>
                    <Th>Descrição</Th>
                    <Th numeric>Valor</Th>
                  </tr>
                </thead>
                <tbody>
                  {txs.data.items.map((tx) => (
                    <tr key={tx.id}>
                      <Td className="whitespace-nowrap">{formatDate(tx.date)}</Td>
                      <Td className="font-bold text-foreground">{tx.description ?? '—'}</Td>
                      <Td numeric>
                        <span
                          className={
                            tx.type === 'receita'
                              ? 'font-bold text-positive'
                              : 'font-bold text-negative'
                          }
                        >
                          {tx.type === 'receita' ? '+ ' : '− '}
                          {money(tx.value)}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {txs.data.nextCursor ? (
                <a
                  href={`/historico?pasta=${folder.id}`}
                  className="mt-2 inline-block text-xs font-bold text-info hover:underline"
                >
                  ver todas no Histórico →
                </a>
              ) : null}
            </>
          ) : (
            <EmptyState
              title="Nenhuma transação nesta pasta"
              hint="Associe transações pelo formulário de nova transação."
            />
          )}
          <div className="mt-3 flex gap-3 text-xs">
            <button
              type="button"
              className="font-bold text-muted hover:text-foreground"
              onClick={() =>
                archive.mutate({ id: folder.id, status: archived ? 'active' : 'archived' })
              }
            >
              {archived ? 'Reativar' : 'Arquivar'}
            </button>
            <button
              type="button"
              className="font-bold text-muted hover:text-negative"
              onClick={() => {
                if (
                  window.confirm(
                    `Excluir a pasta "${folder.name}"? As transações continuam existindo, apenas sem pasta.`,
                  )
                ) {
                  del.mutate({ id: folder.id })
                }
              }}
            >
              Excluir
            </button>
          </div>
        </div>
      ) : null}
    </Card>
  )
}

export default function FoldersPage() {
  const { data: folders, isLoading } = trpc.folders.list.useQuery()
  const utils = trpc.useUtils()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')

  const create = trpc.folders.create.useMutation({
    onSuccess: () => {
      utils.folders.invalidate()
      setOpen(false)
      setName('')
      setIcon('')
    },
  })

  return (
    <>
      <PageHeader
        title="Pastas"
        subtitle="Agrupe despesas de um objetivo (viagem, reforma, evento) e acompanhe o custo total."
      >
        <Button onClick={() => setOpen(true)}>+ Nova pasta</Button>
      </PageHeader>

      {isLoading ? (
        <LoadingState />
      ) : folders && folders.length > 0 ? (
        <div className="space-y-4">
          {folders.map((f) => (
            <FolderCard key={f.id} folder={f} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma pasta ainda"
          hint='Crie uma pasta como "Viagem Chile" e associe despesas a ela.'
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Nova pasta">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (name.trim()) create.mutate({ name: name.trim(), icon: icon || undefined })
            }}
          >
            <div className="grid grid-cols-[1fr_5rem] gap-3">
              <Field>
                <Label htmlFor="folder-name">Nome</Label>
                <Input
                  id="folder-name"
                  required
                  placeholder="Viagem Chile"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="folder-icon">Emoji</Label>
                <Input
                  id="folder-icon"
                  placeholder="✈️"
                  maxLength={4}
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                />
              </Field>
            </div>
            <Button type="submit" disabled={create.isPending} className="w-full">
              Criar pasta
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
