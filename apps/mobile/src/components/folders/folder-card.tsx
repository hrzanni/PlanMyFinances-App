import { Pressable, Text, View, useColorScheme } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { RouterOutputs } from '@/lib/trpc'
import { money } from '@/lib/format'
import { Badge, Card } from '@/components/ui'

export type FolderRow = RouterOutputs['folders']['list'][number]

/** Card do grid (2 colunas): abre a bottom sheet de detalhe ao tocar. */
export function FolderCard({ folder, onOpen }: { folder: FolderRow; onOpen: () => void }) {
  const archived = folder.status === 'archived'
  const dark = useColorScheme() === 'dark'
  const iconColor = archived ? '#9C9B9B' : dark ? '#FFFFFF' : '#0C0E0E'
  return (
    <Pressable accessibilityRole="button" onPress={onOpen} className="w-[48%]">
      <Card className={archived ? 'opacity-80' : undefined}>
        <View className="flex-row items-start justify-between">
          <View
            className={`h-9 w-9 items-center justify-center rounded-full ${
              archived ? 'bg-muted/10' : 'bg-foreground/[0.06]'
            }`}
          >
            <Ionicons name="folder-outline" size={16} color={iconColor} />
          </View>
          <Badge tone={archived ? 'neutral' : 'info'} label={archived ? 'arquivada' : 'ativa'} />
        </View>
        <Text
          numberOfLines={1}
          className="mt-2.5 text-sm font-bold text-foreground dark:text-foreground-dark"
        >
          {folder.name}
        </Text>
        <Text className="mt-0.5 text-[11px] text-muted dark:text-muted-dark">
          {folder.txCount} transaç{folder.txCount === 1 ? 'ão' : 'ões'}
        </Text>
        <Text className="mt-2 text-base font-black tabular-nums text-foreground dark:text-foreground-dark">
          {money(folder.totalSpent)}
        </Text>
      </Card>
    </Pressable>
  )
}
