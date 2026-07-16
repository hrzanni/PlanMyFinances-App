import { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui'
import { FolderKpis } from '@/components/folders/folder-kpis'
import {
  FolderStatusPills,
  type FolderStatusFilter,
} from '@/components/folders/folder-status-pills'
import { FolderGrid } from '@/components/folders/folder-grid'
import { FolderFormSheet } from '@/components/folders/folder-form-sheet'
import { FolderDetailSheet } from '@/components/folders/folder-detail-sheet'
import type { FolderRow } from '@/components/folders/folder-card'

type FormState = { mode: 'create' } | { mode: 'edit'; folder: FolderRow } | null

export default function FoldersScreen() {
  const { data: folders } = trpc.folders.list.useQuery()
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

  return (
    <ScrollView className="flex-1 px-4 pt-3" keyboardShouldPersistTaps="handled">
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
        emptyTitle={statusFilter === 'arquivadas' ? 'Nenhuma pasta arquivada' : 'Nenhuma pasta'}
        emptyHint={statusFilter === 'arquivadas' ? undefined : 'Crie "Viagem Chile" e associe despesas.'}
        onOpen={(folder) => setSelectedId(folder.id)}
      />

      <View className="my-4">
        <Button title="+ Nova pasta" onPress={() => setForm({ mode: 'create' })} />
      </View>

      <FolderFormSheet
        open={form !== null}
        onClose={() => setForm(null)}
        initialName={form?.mode === 'edit' ? form.folder.name : ''}
        saving={create.isPending || update.isPending}
        onSubmit={handleFormSubmit}
      />

      <FolderDetailSheet
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
        onDelete={(folder) => del.mutate({ id: folder.id })}
      />
    </ScrollView>
  )
}
