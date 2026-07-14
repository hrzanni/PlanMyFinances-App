import { ScrollView, Text, View, Pressable } from 'react-native'
import { trpc } from '@/lib/trpc'
import { BankLogo } from './bank-logo'

const tileBase =
  'flex-row items-center gap-2 rounded-2xl border px-3 py-2 bg-surface dark:bg-surface-dark'

/** Faixa-filtro horizontal de cartões: "Todos" + chips compactos + "+ Cartão". */
export function CardStrip({
  selected,
  onSelect,
  onAddCard,
}: {
  selected: string | 'all'
  onSelect: (id: string | 'all') => void
  onAddCard: () => void
}) {
  const cards = trpc.cards.list.useQuery()
  const list = cards.data ?? []

  const tileCls = (active: boolean) =>
    `${tileBase} ${
      active
        ? 'border-foreground dark:border-foreground-dark'
        : 'border-line dark:border-line-dark'
    }`

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-4"
      contentContainerStyle={{ gap: 8, paddingRight: 4 }}
    >
      <Pressable className={tileCls(selected === 'all')} onPress={() => onSelect('all')}>
        <View className="overflow-hidden rounded-full">
          <BankLogo preset="outro" size={22} />
        </View>
        <Text className="text-xs font-bold text-foreground dark:text-foreground-dark">Todos</Text>
      </Pressable>

      {list.map((card) => (
        <Pressable
          key={card.id}
          className={tileCls(selected === card.id)}
          onPress={() => onSelect(card.id)}
        >
          <View className="overflow-hidden rounded-full">
            <BankLogo preset={card.bankPreset} size={22} />
          </View>
          <Text className="text-xs font-bold text-foreground dark:text-foreground-dark">
            {card.name}
          </Text>
        </Pressable>
      ))}

      <Pressable
        onPress={onAddCard}
        className="flex-row items-center justify-center rounded-2xl border border-dashed border-line px-3 py-2 dark:border-line-dark"
      >
        <Text className="text-xs font-bold text-muted dark:text-muted-dark">+ Cartão</Text>
      </Pressable>
    </ScrollView>
  )
}
