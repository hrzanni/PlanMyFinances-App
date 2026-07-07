export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-10 text-center">
      <div className="text-sm font-bold text-foreground">{title}</div>
      {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
    </div>
  )
}

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return <div className="px-2 py-8 text-center text-sm text-muted">{label}</div>
}

export function ErrorState({
  message = 'Erro ao carregar. Tente novamente.',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-xl border border-negative/30 bg-negative/5 px-6 py-8 text-center">
      <div className="text-sm font-bold text-negative">{message}</div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-xs font-bold text-info underline-offset-2 hover:underline"
        >
          Tentar de novo
        </button>
      ) : null}
    </div>
  )
}
