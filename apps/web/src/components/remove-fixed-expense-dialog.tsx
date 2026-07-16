'use client'

import { useState } from 'react'
import { Button, Dialog, DialogContent } from '@pmf/ui-web'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  onEnd: () => void
  onDelete: () => void
}

/** Remover um fixo: "Encerrar" (padrão, preserva histórico) vs "Excluir definitivamente" (com 2ª confirmação). */
export function RemoveFixedExpenseDialog({ open, onOpenChange, name, onEnd, onDelete }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function close() {
    setConfirmingDelete(false)
    onOpenChange(false)
  }

  if (confirmingDelete) {
    return (
      <Dialog open={open} onOpenChange={close}>
        <DialogContent
          title="Excluir definitivamente?"
          description={`Isso remove "${name}" e todo o histórico de valores e pagamentos junto. Não pode ser desfeito.`}
        >
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={close}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                onDelete()
                close()
              }}
            >
              Excluir definitivamente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        title={`Remover "${name}"`}
        description="Encerrar mantém todo o histórico e só para de gerar o fixo dali em diante. Excluir definitivamente apaga tudo."
      >
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              onEnd()
              close()
            }}
          >
            Encerrar
          </Button>
          <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
            Excluir definitivamente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
