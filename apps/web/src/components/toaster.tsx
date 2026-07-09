'use client'

import { useEffect, useState } from 'react'
import { onToast, type ToastMessage } from '@/lib/toast'

const DISMISS_MS = 5000

/** Pilha de toasts de erro no canto inferior direito. Montar uma vez, no Providers. */
export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(
    () =>
      onToast((toast) => {
        setToasts((current) => [...current, toast])
        setTimeout(() => {
          setToasts((current) => current.filter((t) => t.id !== toast.id))
        }, DISMISS_MS)
      }),
    [],
  )

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-negative/40 bg-surface px-4 py-3 text-sm text-foreground shadow-lg"
        >
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            aria-label="Fechar aviso"
            className="text-muted hover:text-foreground"
            onClick={() => setToasts((current) => current.filter((t) => t.id !== toast.id))}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
