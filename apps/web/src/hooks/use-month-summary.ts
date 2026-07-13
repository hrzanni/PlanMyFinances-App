import { trpc } from '@/lib/trpc'

/** Resumo do mês (KPIs + saldo diário acumulado). Ponto único da query dashboard.month (RE-003). */
export function useMonthSummary(month: string) {
  return trpc.dashboard.month.useQuery({ month })
}
