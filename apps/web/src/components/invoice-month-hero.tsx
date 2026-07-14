'use client'

import { useMemo } from 'react'
import {
  invoiceMonthSummary,
  type InstallmentPayment,
  type InvoiceSchedule,
} from '@pmf/core'
import { addMonths, money, monthLabel } from '@/lib/format'
import { globalOverdue } from './invoice-derive'

type HeroRow = { schedule: InvoiceSchedule; payments: InstallmentPayment[] }

const shortMonth = (m: string) =>
  new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 15))
    .toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' })
    .replace('.', '')

const fmtK = (n: number) =>
  n >= 1000
    ? (n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k'
    : String(Math.round(n))

/** Hero escuro + barras dos 12 meses (mês corrente −4/+7). */
export function InvoiceMonthHero({
  rows,
  month,
  onMonthChange,
  today,
}: {
  rows: HeroRow[]
  month: string
  onMonthChange: (m: string) => void
  today: string
}) {
  const current = today.slice(0, 7)
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => addMonths(current, i - 4)),
    [current],
  )
  const totals = useMemo(
    () => months.map((m) => ({ m, s: invoiceMonthSummary(rows, m, today) })),
    [months, rows, today],
  )

  const sel = invoiceMonthSummary(rows, month, today)
  const ovd = globalOverdue(rows, today)
  const max = Math.max(...totals.map((t) => t.s.total), 1)
  const paidPct = sel.total ? Math.round((sel.paidAmt / sel.total) * 100) : 0
  const allPaid = sel.nPend === 0 && sel.nPaid > 0

  return (
    <div className="mb-4 flex flex-wrap items-stretch gap-6 rounded-[18px] bg-foreground p-5 text-background shadow-md">
      <div className="flex min-w-[220px] flex-1 flex-col justify-center">
        <div className="text-[10px] font-black uppercase tracking-[2.5px] opacity-55">
          A pagar em {monthLabel(month).split(' ')[0]}
          {month === current ? ' · mês atual' : ''}
        </div>
        <div className="my-1 text-[34px] font-black leading-none tracking-tight tabular-nums">
          {money(sel.due)}
        </div>
        <div className="text-[12.5px] opacity-80">
          {allPaid ? (
            <span className="font-bold text-positive">✓ tudo pago neste mês</span>
          ) : (
            <>
              {sel.nPend} {sel.nPend === 1 ? 'parcela em aberto' : 'parcelas em aberto'}
              {sel.nPaid ? (
                <>
                  {' · '}
                  <span className="font-bold text-positive">{money(sel.paidAmt)} já pagos ✓</span>
                </>
              ) : null}
            </>
          )}
        </div>
        {ovd.count ? (
          <div className="mt-1.5 text-xs font-bold text-negative">
            ⚠ {ovd.count} {ovd.count === 1 ? 'parcela em atraso' : 'parcelas em atraso'} ·{' '}
            {money(ovd.amt)}
          </div>
        ) : null}
        <div className="mt-3 h-1.5 max-w-[320px] overflow-hidden rounded-full bg-background/20">
          <div
            className="h-full rounded-full bg-positive transition-[width] duration-500"
            style={{ width: `${paidPct}%` }}
          />
        </div>
      </div>

      <div className="flex items-end gap-2 pt-1.5">
        {totals.map(({ m, s }) => {
          const h = Math.max(Math.round((s.total / max) * 100), 6)
          const paidH = s.total ? Math.round((s.paidAmt / s.total) * 100) : 0
          const ovdH = s.total ? Math.round((s.overdue / s.total) * 100) : 0
          const isSel = m === month
          return (
            <button
              type="button"
              key={m}
              onClick={() => onMonthChange(m)}
              title={`${monthLabel(m)}: ${money(s.total)}`}
              className="w-[42px] text-center"
            >
              <span className="flex h-[62px] items-end justify-center">
                <span
                  className={`relative block w-[22px] overflow-hidden rounded-t-[7px] ${
                    isSel ? 'bg-background/95' : 'bg-background/20'
                  }`}
                  style={{ height: `${h}%`, minHeight: 4 }}
                >
                  <span className="absolute inset-x-0 bottom-0 bg-positive" style={{ height: `${paidH}%` }} />
                  <span
                    className="absolute inset-x-0 bg-negative"
                    style={{ bottom: `${paidH}%`, height: `${ovdH}%` }}
                  />
                </span>
              </span>
              <span
                className={`mt-1.5 block text-[9.5px] uppercase tracking-wider ${
                  isSel ? 'font-black opacity-100' : 'font-bold opacity-55'
                }`}
              >
                {shortMonth(m)}
                {m === current ? '·' : ''}
              </span>
              <span className={`block h-2.5 text-[9px] tabular-nums ${isSel ? 'opacity-80' : 'opacity-0'}`}>
                {s.total ? fmtK(s.total) : ''}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
