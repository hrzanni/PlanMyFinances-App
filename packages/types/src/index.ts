export type TransactionType = 'receita' | 'despesa'
export type TransactionSource = 'manual' | 'fixed_expense' | 'pluggy'
export type ChargeStatus = 'pendente' | 'cobrado' | 'pago'
export type InvoiceStatus = 'pendente' | 'pago'
export type FixedExpenseStatus = 'active' | 'archived'
export type FolderStatus = 'active' | 'archived'
export type BankConnectionStatus = 'connected' | 'error' | 'expired'
/** Status mensal derivado de um gasto fixo (RN-100). Nunca é persistido. */
export type MonthlyExpenseStatus = 'pago' | 'pendente' | 'vencido'

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  value: string
  description: string | null
  categoryId: string | null
  subcategoryId: string | null
  folderId: string | null
  source: TransactionSource
  externalId: string | null
  date: string
  createdAt: string
}

export interface Category {
  id: string
  userId: string
  name: string
  type: TransactionType
}

export interface Subcategory {
  id: string
  userId: string
  categoryId: string
  name: string
}

export interface Charge {
  id: string
  userId: string
  debtorName: string
  description: string | null
  amountPerInstallment: string
  totalInstallments: number
  amountPaid: string
  dueDate: string | null
  status: ChargeStatus
  createdAt: string
}

export interface Invoice {
  id: string
  userId: string
  cardName: string
  description: string | null
  amountPerInstallment: string
  totalInstallments: number
  amountPaid: string
  dueDate: string | null
  status: InvoiceStatus
  createdAt: string
}

export interface FixedExpense {
  id: string
  userId: string
  name: string
  amount: string
  dueDay: number
  categoryId: string | null
  status: FixedExpenseStatus
  createdAt: string
}

export interface FixedExpensePayment {
  id: string
  userId: string
  fixedExpenseId: string
  referenceMonth: string
  amount: string
  paidAt: string
  transactionId: string | null
  createdAt: string
}

export interface Folder {
  id: string
  userId: string
  name: string
  icon: string | null
  status: FolderStatus
  createdAt: string
}

export interface BankConnection {
  id: string
  userId: string
  pluggyItemId: string
  institutionName: string
  status: BankConnectionStatus
  lastSyncedAt: string | null
  consentExpiresAt: string | null
  createdAt: string
}
