'use client'

import { Button, Kpi } from '@pmf/ui-web'
import type { ChargesKpis } from '@pmf/core'
import { money } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { ChargeStatusPills, type ChargeStatusFilter } from './charge-status-pills'

/** Cabeçalho da tela de Cobranças: título+ação, KPIs 2x2 e filtro de status. */
export function ChargesHeader({
  kpis,
  filter,
  onFilterChange,
  counts,
  onCreate,
}: {
  kpis: ChargesKpis
  filter: ChargeStatusFilter
  onFilterChange: (filter: ChargeStatusFilter) => void
  counts: Record<ChargeStatusFilter, number>
  onCreate: () => void
}) {
  return (
    <>
      <PageHeader
        title={
          <>
            Cobranças <span className="text-sm font-normal text-muted">· a receber</span>
          </>
        }
      >
        <Button onClick={onCreate}>+ Nova cobrança</Button>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Kpi label="A receber" value={money(kpis.receivable)} />
        <Kpi label="Recebido" value={money(kpis.received)} tone="positive" />
        <Kpi
          label="Atrasadas"
          value={String(kpis.overdueCount)}
          tone={kpis.overdueCount > 0 ? 'negative' : 'neutral'}
        />
        <Kpi label="Vence este mês" value={money(kpis.dueThisMonth)} />
      </div>

      <ChargeStatusPills value={filter} onChange={onFilterChange} counts={counts} />
    </>
  )
}
