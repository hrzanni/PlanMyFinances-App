/**
 * Bus de toasts mínimo (sem contexto React): módulos fora da árvore
 * (ex.: MutationCache) publicam; o <Toaster /> assina e renderiza.
 */
export interface ToastMessage {
  id: number
  message: string
}

type Listener = (toast: ToastMessage) => void

let listeners: Listener[] = []
let nextId = 1

export function showErrorToast(message: string) {
  const toast: ToastMessage = { id: nextId++, message }
  for (const listener of listeners) listener(toast)
}

export function onToast(listener: Listener): () => void {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}
