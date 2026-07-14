import { pgEnum } from 'drizzle-orm/pg-core'

export const txType = pgEnum('tx_type', ['receita', 'despesa'])
export const txSource = pgEnum('tx_source', [
  'manual',
  'fixed_expense',
  'pluggy',
  'charge',
  'invoice',
])
export const chargeStatus = pgEnum('charge_status', ['pendente', 'cobrado', 'pago'])
export const invoiceStatus = pgEnum('invoice_status', ['pendente', 'pago'])
export const activeStatus = pgEnum('active_status', ['active', 'archived'])
export const connectionStatus = pgEnum('connection_status', ['connected', 'error', 'expired'])
export const bankPreset = pgEnum('bank_preset', [
  'nubank',
  'inter',
  'banco_do_brasil',
  'santander',
  'caixa',
  'outro',
])
