'use client'

import { useState } from 'react'
import { Drawer, DrawerContent } from '@pmf/ui-web'
import { money } from '@/lib/format'
import type { FolderRow } from './folder-card'
import { FolderCategoryBreakdown } from './folder-category-breakdown'
import { FolderDetailTransactions } from './folder-detail-transactions'

interface FolderDetailDrawerProps {
  folder: FolderRow | null
  onClose: () => void
  onEdit: (folder: FolderRow) => void
  onArchiveToggle: (folder: FolderRow) => void
  onDelete: (folder: FolderRow) => void
}

function ActionsMenu({
  folder,
  onEdit,
  onArchiveToggle,
  onDelete,
}: {
  folder: FolderRow
  onEdit: () => void
  onArchiveToggle: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const archived = folder.status === 'archived'
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Ações da pasta"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full px-2 py-1 text-lg leading-none text-muted hover:text-foreground"
      >
        ⋯
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-line bg-surface p-1 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onEdit()
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-foreground hover:bg-foreground/5"
            >
              Editar nome
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onArchiveToggle()
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-foreground hover:bg-foreground/5"
            >
              {archived ? 'Reativar pasta' : 'Arquivar pasta'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-negative hover:bg-negative/5"
            >
              Excluir pasta
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}

/** Gaveta de detalhe: nome/total, ações (⋯) e a pasta inteira — sem ir pro Histórico. */
export function FolderDetailDrawer({
  folder,
  onClose,
  onEdit,
  onArchiveToggle,
  onDelete,
}: FolderDetailDrawerProps) {
  return (
    <Drawer open={folder !== null} onOpenChange={(open) => !open && onClose()}>
      {folder ? (
        <DrawerContent title={folder.name}>
          <div className="mb-1 flex items-start justify-between gap-2">
            <h2 className="text-lg font-black tracking-tight text-foreground">{folder.name}</h2>
            <ActionsMenu
              folder={folder}
              onEdit={() => onEdit(folder)}
              onArchiveToggle={() => onArchiveToggle(folder)}
              onDelete={() => onDelete(folder)}
            />
          </div>
          <div className="mb-5 text-2xl font-black tabular-nums text-foreground">
            {money(folder.totalSpent)}
          </div>
          <div className="flex flex-col gap-5">
            <FolderCategoryBreakdown folderId={folder.id} />
            <div className="border-t border-dashed border-line pt-4">
              <FolderDetailTransactions folderId={folder.id} />
            </div>
          </div>
        </DrawerContent>
      ) : null}
    </Drawer>
  )
}
