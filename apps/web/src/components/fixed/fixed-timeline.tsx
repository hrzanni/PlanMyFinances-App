import { fixedDueBadge, fixedDueInfo, groupFixedByDueDay } from '@pmf/core'
import { Badge, Toggle } from '@pmf/ui-web'
import { money } from '@/lib/format'
import { DayDot, TypeIcon } from './timeline-bits'

export interface FixedTimelineItemData {
  id: string
  name: string
  type: 'despesa' | 'receita'
  amount: string
  dueDay: number
  categoryId: string | null
  monthlyStatus: 'pago' | 'pendente' | 'vencido'
  payment: { amount: string; paidAt: string } | null
}

interface FixedTimelineProps {
  items: FixedTimelineItemData[]
  /** Mês exibido, YYYY-MM. */
  month: string
  /** Hoje, YYYY-MM-DD. */
  today: string
  /** Abreviação do mês exibido para as bolinhas (ex.: "jul"). */
  monthAbbr: string
  categoryNames: Map<string, string>
  mutating: boolean
  onToggle: (item: FixedTimelineItemData, next: boolean) => void
  onEdit: (item: FixedTimelineItemData) => void
  onDelete: (item: FixedTimelineItemData) => void
}

/** Linha do tempo do mês: grupos por dia de vencimento com trilho à esquerda. */
export function FixedTimeline(props: FixedTimelineProps) {
  const groups = groupFixedByDueDay(props.items)
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-4">
      {groups.map((group, index) => {
        const isToday = fixedDueInfo(group.dueDay, props.month, props.today).kind === 'today'
        const last = index === groups.length - 1
        return (
          <div key={group.dueDay} className="flex gap-4">
            <div className="flex w-11 flex-none flex-col items-center">
              <DayDot day={group.dueDay} monthAbbr={props.monthAbbr} today={isToday} />
              {last ? null : <div className="w-px flex-1 bg-line" />}
            </div>
            <div className={`flex min-w-0 flex-1 flex-col gap-2 ${last ? 'pb-1' : 'pb-5'}`}>
              {group.items.map((item) => (
                <TimelineRow key={item.id} item={item} {...props} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TimelineRow({
  item,
  month,
  today,
  categoryNames,
  mutating,
  onToggle,
  onEdit,
  onDelete,
}: FixedTimelineProps & { item: FixedTimelineItemData }) {
  const paid = item.monthlyStatus === 'pago'
  const badge = fixedDueBadge(
    { type: item.type, dueDay: item.dueDay, monthlyStatus: item.monthlyStatus, paidAt: item.payment?.paidAt ?? null },
    month,
    today,
  )
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
        item.monthlyStatus === 'vencido' ? 'border-negative/45' : 'border-line'
      } ${paid ? 'opacity-60' : ''}`}
    >
      <TypeIcon type={item.type} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-foreground">{item.name}</div>
        <div className="truncate text-xs text-muted">
          {(item.categoryId && categoryNames.get(item.categoryId)) || 'Sem categoria'}
        </div>
      </div>
      <div
        className={`text-sm font-black tabular-nums ${
          item.type === 'receita' ? 'text-positive' : 'text-negative'
        }`}
      >
        {item.type === 'receita' ? '+' : ''}
        {money(paid && item.payment ? item.payment.amount : item.amount)}
      </div>
      <Badge tone={badge.tone}>{badge.label}</Badge>
      <Toggle
        checked={paid}
        disabled={mutating}
        aria-label={`Marcar ${item.name} como ${
          paid ? 'pendente' : item.type === 'receita' ? 'recebido' : 'pago'
        }`}
        onCheckedChange={(next) => onToggle(item, next)}
      />
      <span className="inline-flex gap-2">
        <button
          type="button"
          aria-label={`Editar ${item.name}`}
          className="text-muted hover:text-foreground"
          onClick={() => onEdit(item)}
        >
          ✎
        </button>
        <button
          type="button"
          aria-label={`Excluir ${item.name}`}
          className="text-muted hover:text-negative"
          onClick={() => onDelete(item)}
        >
          🗑
        </button>
      </span>
    </div>
  )
}
