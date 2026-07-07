import { pgEnum } from 'drizzle-orm/pg-core'

export const txType = pgEnum('tx_type', ['receita', 'despesa'])
export const txSource = pgEnum('tx_source', ['manual', 'fixed_expense', 'pluggy'])
export const chargeStatus = pgEnum('charge_status', ['pendente', 'cobrado', 'pago'])
export const invoiceStatus = pgEnum('invoice_status', ['pendente', 'pago'])
export const activeStatus = pgEnum('active_status', ['active', 'archived'])
export const connectionStatus = pgEnum('connection_status', ['connected', 'error', 'expired'])
