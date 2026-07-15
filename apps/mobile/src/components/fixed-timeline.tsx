import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { fixedDueBadge, fixedDueInfo, groupFixedByDueDay } from '@pmf/core'
import { money } from '@/lib/format'
import { Badge, Toggle } from '@/components/ui'
import { DayDot, TypeIcon } from './fixed-timeline-bits'

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
  month: string
  today: string
  monthAbbr: string
  categoryNames: Map<string, string>
  mutating: boolean
  onToggle: (item: FixedTimelineItemData, next: boolean) => void
  onEdit: (item: FixedTimelineItemData) => void
  onDelete: (item: FixedTimelineItemData) => void
}

/** Linha do tempo por dia de vencimento — versão RN. */
export function FixedTimeline(props: FixedTimelineProps) {
  const groups = groupFixedByDueDay(props.items)
  return (
    <View>
      {groups.map((group, index) => {
        const isToday = fixedDueInfo(group.dueDay, props.month, props.today).kind === 'today'
        const last = index === groups.length - 1
        return (
          <View key={group.dueDay} className="flex-row gap-3">
            <View className="w-10 items-center">
              <DayDot day={group.dueDay} monthAbbr={props.monthAbbr} today={isToday} />
              {last ? null : <View className="w-px flex-1 bg-line dark:bg-line-dark" />}
            </View>
            <View className={`min-w-0 flex-1 gap-2 ${last ? 'pb-1' : 'pb-4'}`}>
              {group.items.map((item) => (
                <TimelineRow key={item.id} item={item} {...props} />
              ))}
            </View>
          </View>
        )
      })}
    </View>
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
    <View
      className={`flex-row items-center gap-2.5 rounded-xl border bg-surface px-3 py-2.5 dark:bg-surface-dark ${
        item.monthlyStatus === 'vencido'
          ? 'border-negative/45 dark:border-negative-dark/45'
          : 'border-line dark:border-line-dark'
      } ${paid ? 'opacity-60' : ''}`}
    >
      <TypeIcon type={item.type} />
      <View className="min-w-0 flex-1">
        <Text
          className="text-sm font-bold text-foreground dark:text-foreground-dark"
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View className="mt-0.5 flex-row flex-wrap items-center gap-1.5">
          <Text className="text-[11px] text-muted dark:text-muted-dark" numberOfLines={1}>
            {(item.categoryId && categoryNames.get(item.categoryId)) || 'Sem categoria'} ·{' '}
            <Text
              className={`font-black tabular-nums ${
                item.type === 'receita'
                  ? 'text-positive dark:text-positive-dark'
                  : 'text-negative dark:text-negative-dark'
              }`}
            >
              {item.type === 'receita' ? '+' : ''}
              {money(paid && item.payment ? item.payment.amount : item.amount)}
            </Text>
          </Text>
          <Badge tone={badge.tone} label={badge.label} />
        </View>
      </View>
      <Pressable accessibilityLabel={`Editar ${item.name}`} hitSlop={8} onPress={() => onEdit(item)}>
        <Ionicons name="create-outline" size={18} color="#9C9B9B" />
      </Pressable>
      <Pressable
        accessibilityLabel={`Excluir ${item.name}`}
        hitSlop={8}
        onPress={() => onDelete(item)}
      >
        <Ionicons name="trash-outline" size={18} color="#9C9B9B" />
      </Pressable>
      <Toggle checked={paid} disabled={mutating} onChange={(next) => onToggle(item, next)} />
    </View>
  )
}
