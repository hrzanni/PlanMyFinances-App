import { useMemo } from 'react'
import { Text, View } from 'react-native'
import { Link } from 'expo-router'
import type { MonthlyExpenseStatus } from '@pmf/types'
import type { FixedExpenseTotals } from '@pmf/core'
import { fixedBalance, fixedDueBadge, fixedDueInfo, fixedProgress, nextPendingFixed } from '@pmf/core'
import { trpc } from '@/lib/trpc'
import { money, monthLabel } from '@/lib/format'
import { Badge, Card, EmptyState } from '@/components/ui'
import { DayDot } from './fixed-timeline-bits'

/** Widget da Início: mini agenda das próximas pendências + progresso do mês — versão RN. */
export function FixedMonthWidget({ month }: { month: string }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const list = trpc.fixedExpenses.list.useQuery({ month })
  const categories = trpc.categories.list.useQuery()

  const items = list.data?.items ?? []
  const totals = list.data?.totals
  const categoryNames = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  )

  if (list.isLoading) {
    return (
      <Card className="mt-4">
        <Text className="py-4 text-center text-sm text-muted dark:text-muted-dark">
          Carregando…
        </Text>
      </Card>
    )
  }

  const balance = totals ? fixedBalance(totals) : 0
  const upcoming = nextPendingFixed(items, 3)
  const monthAbbr = monthLabel(month).slice(0, 3).toLowerCase()

  return (
    <Card className="mb-8 mt-4">
      <View className="mb-2 flex-row items-center justify-between gap-2">
        <Text className="text-[10px] font-black uppercase tracking-[2.5px] text-muted dark:text-muted-dark">
          Fixos do mês
        </Text>
        {items.length > 0 ? (
          <Text
            className={`rounded-full px-2.5 py-0.5 text-xs font-black tabular-nums ${
              balance < 0
                ? 'bg-negative/10 text-negative dark:text-negative-dark'
                : 'bg-positive/10 text-positive dark:text-positive-dark'
            }`}
          >
            {balance < 0 ? '−' : '+'}
            {money(Math.abs(balance))}
          </Text>
        ) : null}
      </View>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhum fixo cadastrado"
          hint="Cadastre aluguel, contas, assinaturas e salário na aba Fixos."
        />
      ) : (
        <>
          {upcoming.length === 0 ? (
            <Text className="py-1 text-lg font-black text-positive dark:text-positive-dark">
              ✓ Tudo em dia
            </Text>
          ) : (
            upcoming.map((item) => {
              const badge = fixedDueBadge(
                {
                  type: item.type,
                  dueDay: item.dueDay,
                  monthlyStatus: item.monthlyStatus,
                  paidAt: item.payment?.paidAt ?? null,
                },
                month,
                today,
              )
              const isToday = fixedDueInfo(item.dueDay, month, today).kind === 'today'
              return (
                <View key={item.id} className="flex-row items-center gap-2.5 py-1.5">
                  <DayDot day={item.dueDay} monthAbbr={monthAbbr} today={isToday} />
                  <View className="min-w-0 flex-1">
                    <Text
                      className="text-sm font-bold text-foreground dark:text-foreground-dark"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text className="text-xs text-muted dark:text-muted-dark" numberOfLines={1}>
                      {(item.categoryId && categoryNames.get(item.categoryId)) || 'Sem categoria'}
                    </Text>
                  </View>
                  <Text
                    className={`text-sm font-black tabular-nums ${
                      item.type === 'receita'
                        ? 'text-positive dark:text-positive-dark'
                        : 'text-negative dark:text-negative-dark'
                    }`}
                  >
                    {item.type === 'receita' ? '+' : ''}
                    {money(item.amount)}
                  </Text>
                  <Badge tone={badge.tone} label={badge.label} />
                </View>
              )
            })
          )}

          <View className="my-2 border-t border-line dark:border-line-dark" />
          {totals ? (
            <>
              <ProgressRow kind="despesa" items={items} totals={totals} />
              <ProgressRow kind="receita" items={items} totals={totals} />
            </>
          ) : null}

          <View className="mt-1 items-end">
            <Link href="/(tabs)/fixos" className="text-xs font-bold text-info dark:text-info-dark">
              Ver todos →
            </Link>
          </View>
        </>
      )}
    </Card>
  )
}

function ProgressRow({
  kind,
  items,
  totals,
}: {
  kind: 'despesa' | 'receita'
  items: Array<{ type: 'despesa' | 'receita'; monthlyStatus: MonthlyExpenseStatus; amount: string }>
  totals: { expense: FixedExpenseTotals; income: FixedExpenseTotals }
}) {
  const t = kind === 'despesa' ? totals.expense : totals.income
  const { paidCount, totalCount, paidPct, latePct } = fixedProgress(items, kind, t)
  const noun = kind === 'despesa' ? 'pagas' : 'recebidas'
  const pendingLabel = kind === 'despesa' ? 'pend.' : 'a receber'
  return (
    <View className="mb-2">
      <View className="flex-row items-baseline gap-1.5">
        <Text className="text-xs font-black text-foreground dark:text-foreground-dark">
          {kind === 'despesa' ? 'Despesas' : 'Receitas'}
        </Text>
        <Text className="text-xs text-muted dark:text-muted-dark">
          {paidCount} de {totalCount} {noun}
        </Text>
        <Text className="ml-auto text-xs tabular-nums text-muted dark:text-muted-dark">
          {money(t.pending)} {pendingLabel}
        </Text>
      </View>
      <View className="mt-1 h-1.5 flex-row overflow-hidden rounded-full bg-line dark:bg-line-dark">
        <View className="h-full rounded-full bg-positive dark:bg-positive-dark" style={{ width: `${paidPct}%` }} />
        {latePct > 0 ? (
          <View className="h-full bg-negative dark:bg-negative-dark" style={{ width: `${latePct}%` }} />
        ) : null}
      </View>
    </View>
  )
}
