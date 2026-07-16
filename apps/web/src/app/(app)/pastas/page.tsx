'use client'

import { useMemo, useState } from 'react'
import { Button, LoadingState } from '@pmf/ui-web'
import { trpc } from '@/lib/trpc'
import { PageHeader } from '@/components/page-header'
import { FolderKpis } from '@/components/folders/folder-kpis'
import { FolderStatusPills, type FolderStatusFilter } from '@/components/folders/folder-status-pills'
import { FolderGrid } from '@/components/folders/folder-grid'
import { FolderFormDialog } from '@/components/folders/folder-form-dialog'
import { FolderDetailDrawer } from '@/components/folders/folder-detail-drawer'
import type { FolderRow } from '@/components/folders/folder-card'

type FormState = { mode: 'create' } | { mode: 'edit'; folder: FolderRow } | null

export default function FoldersPage() {
  const { data: folders, isLoading } = trpc.folders.list.useQuery()
  const utils = trpc.useUtils()

  const [statusFilter, setStatusFilter] = useState<FolderStatusFilter>('todas')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(null)

  const invalidateFolders = () => utils.folders.invalidate()

  const create = trpc.folders.create.useMutation({
    onSuccess: () => {
      invalidateFolders()
      setForm(null)
    },
  })
  const update = trpc.folders.update.useMutation({ onSuccess: invalidateFolders })
  const del = trpc.folders.delete.useMutation({
    onSuccess: () => {
      invalidateFolders()
      utils.transactions.invalidate()
      setSelectedId(null)
    },
  })

  const active = useMemo(() => (folders ?? []).filter((f) => f.status === 'active'), [folders])
  const archived = useMemo(() => (folders ?? []).filter((f) => f.status === 'archived'), [folders])

  const visible =
    statusFilter === 'ativas' ? active : statusFilter === 'arquivadas' ? archived : (folders ?? [])

  const selectedFolder = folders?.find((f) => f.id === selectedId) ?? null

  function handleFormSubmit(name: string) {
    if (form?.mode === 'edit') {
      update.mutate({ id: form.folder.id, name })
      setForm(null)
    } else {
      create.mutate({ name })
    }
  }

  function handleDelete(folder: FolderRow) {
    if (
      window.confirm(
        `Excluir a pasta "${folder.name}"? As transações continuam existindo, apenas sem pasta.`,
      )
    ) {
      del.mutate({ id: folder.id })
    }
  }

  return (
    <>
      <PageHeader
        title="Pastas"
        subtitle="Agrupe despesas de um objetivo (viagem, reforma, evento) e acompanhe o custo total."
      >
        <Button onClick={() => setForm({ mode: 'create' })}>+ Nova pasta</Button>
      </PageHeader>

      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          <FolderKpis
            total={(folders ?? []).length}
            active={active.length}
            archived={archived.length}
          />
          <FolderStatusPills
            value={statusFilter}
            onChange={setStatusFilter}
            counts={{
              todas: (folders ?? []).length,
              ativas: active.length,
              arquivadas: archived.length,
            }}
          />
          <FolderGrid
            folders={visible}
            emptyTitle={
              statusFilter === 'arquivadas' ? 'Nenhuma pasta arquivada' : 'Nenhuma pasta ainda'
            }
            emptyHint={
              statusFilter === 'arquivadas'
                ? undefined
                : 'Crie uma pasta como "Viagem Chile" e associe despesas a ela.'
            }
            onOpen={(folder) => setSelectedId(folder.id)}
          />
        </>
      )}

      <FolderFormDialog
        open={form !== null}
        onOpenChange={(open) => !open && setForm(null)}
        initialName={form?.mode === 'edit' ? form.folder.name : ''}
        saving={create.isPending || update.isPending}
        onSubmit={handleFormSubmit}
      />

      <FolderDetailDrawer
        folder={selectedFolder}
        onClose={() => setSelectedId(null)}
        onEdit={(folder) => {
          setSelectedId(null)
          setForm({ mode: 'edit', folder })
        }}
        onArchiveToggle={(folder) =>
          update.mutate({
            id: folder.id,
            status: folder.status === 'archived' ? 'active' : 'archived',
          })
        }
        onDelete={handleDelete}
      />
    </>
  )
}
