import { EmptyState } from '@pmf/ui-web'
import { ChargeCard } from './charge-card'
import type { ChargeRow } from './charge-adapt'

export function ChargeGrid({
  charges,
  today,
  emptyTitle,
  emptyHint,
  onOpen,
}: {
  charges: ChargeRow[]
  today: string
  emptyTitle: string
  emptyHint?: string
  onOpen: (charge: ChargeRow) => void
}) {
  if (charges.length === 0) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {charges.map((charge, i) => (
        <ChargeCard
          key={charge.id}
          charge={charge}
          today={today}
          style={{ animationDelay: `${Math.min(i, 8) * 0.03}s` }}
          onOpen={() => onOpen(charge)}
        />
      ))}
    </div>
  )
}
