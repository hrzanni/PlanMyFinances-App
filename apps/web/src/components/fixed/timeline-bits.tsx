/** Peças compartilhadas da agenda de fixos (timeline da tela + widget da Início). */

export function TypeIcon({ type }: { type: 'despesa' | 'receita' }) {
  const income = type === 'receita'
  return (
    <span
      aria-hidden
      className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${
        income ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {income ? <path d="M7 17L17 7M17 7H9M17 7v8" /> : <path d="M7 7l10 10M17 17H9M17 17V9" />}
      </svg>
    </span>
  )
}

export function DayDot({
  day,
  monthAbbr,
  today = false,
}: {
  day: number
  monthAbbr: string
  today?: boolean
}) {
  return (
    <span
      className={`flex h-11 w-11 flex-none flex-col items-center justify-center rounded-full border text-sm font-black leading-none ${
        today
          ? 'border-foreground bg-foreground text-background'
          : 'border-line bg-background text-foreground'
      }`}
    >
      {String(day).padStart(2, '0')}
      <span
        className={`mt-0.5 text-[8px] font-bold uppercase leading-none ${
          today ? 'text-background/70' : 'text-muted'
        }`}
      >
        {today ? 'hoje' : monthAbbr}
      </span>
    </span>
  )
}
