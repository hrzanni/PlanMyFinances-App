import { cn } from './cn'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-line bg-surface p-4', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h4 className={cn('mb-3 text-sm font-bold text-foreground', className)} {...props} />
}

export interface KpiProps {
  label: string
  value: string
  detail?: string
  tone?: 'neutral' | 'positive' | 'negative'
}

/** Card de indicador (3 cards do mês etc.). Cor semântica só no valor. */
export function Kpi({ label, value, detail, tone = 'neutral' }: KpiProps) {
  const toneClass =
    tone === 'positive' ? 'text-positive' : tone === 'negative' ? 'text-negative' : 'text-foreground'
  return (
    <Card>
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className={cn('mt-1 text-2xl font-black tabular-nums', toneClass)}>{value}</div>
      {detail ? <div className="mt-0.5 text-xs text-muted">{detail}</div> : null}
    </Card>
  )
}
