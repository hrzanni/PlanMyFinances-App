'use client'

import { useEffect, useState } from 'react'
import { Button, Dialog, DialogContent, Field, Input, Label } from '@pmf/ui-web'

interface FolderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName?: string
  saving: boolean
  onSubmit: (name: string) => void
}

/** Modal único para criar e editar nome de pasta. */
export function FolderFormDialog({
  open,
  onOpenChange,
  initialName = '',
  saving,
  onSubmit,
}: FolderFormDialogProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState<string | null>(null)
  const editing = initialName !== ''

  useEffect(() => {
    if (open) {
      setName(initialName)
      setError(null)
    }
  }, [open, initialName])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) return setError('Informe o nome')
    onSubmit(name.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={editing ? 'Editar pasta' : 'Nova pasta'}>
        <form onSubmit={handleSubmit}>
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
          {error ? <p className="mb-3 text-xs font-bold text-negative">{error}</p> : null}
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Salvando…' : editing ? 'Salvar' : 'Criar pasta'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
