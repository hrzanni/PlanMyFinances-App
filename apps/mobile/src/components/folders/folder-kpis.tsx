import { View } from 'react-native'
import { Kpi } from '@/components/ui'

/** Faixa de 3 KPIs da tela Pastas — só contagens, sem total em R$ (decisão de escopo). */
export function FolderKpis({
  total,
  active,
  archived,
}: {
  total: number
  active: number
  archived: number
}) {
  return (
    <View className="mb-3 flex-row gap-2">
      <Kpi label="Total de pastas" value={String(total)} />
      <Kpi label="Ativas" value={String(active)} />
      <Kpi label="Arquivadas" value={String(archived)} />
    </View>
  )
}
