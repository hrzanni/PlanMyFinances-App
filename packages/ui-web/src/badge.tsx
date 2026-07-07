import { cn } from './cn'

export type BadgeTone = 'paid' | 'pending' | 'late' | 'info' | 'neutral'

const tones: Record<BadgeTone, string> = {
  paid: 'text-positive bg-positive/10',
  pending: 'text-attention bg-attention/10',
  late: 'text-negative bg-negative/10',
  info: 'text-info bg-info/10',
  neutral: 'text-muted bg-background border border-line',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
