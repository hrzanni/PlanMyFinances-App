import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { isInvoiceClosed } from '@pmf/core'
import { trpc } from '@/lib/trpc'
import { currentMonth } from '@/lib/format'
import { confirmDelete } from '@/lib/confirm'
import { Button, EmptyState } from '@/components/ui'
import { BankLogo } from '@/components/bank-logo'
import { CardStrip } from '@/components/card-strip'
import { CardFormModal, type CardItem } from '@/components/card-form-modal'
import { InvoiceMonthHero } from '@/components/invoice-month-hero'
import { InvoiceCard } from '@/components/invoice-card'
import { InvoiceFormModal } from '@/components/invoice-form-modal'
import { ClosedInvoices } from '@/components/closed-invoices'
import {
  InstallmentPaymentModal,
  type PaymentTarget,
  type PaymentToast,
} from '@/components/installment-payment-modal'
import { toPayments, toSchedule, type InvoiceRow } from '@/components/invoice-derive'

export default function InvoicesScreen() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const utils = trpc.useUtils()
  const list = trpc.invoices.list.useQuery()
  const cards = trpc.cards.list.useQuery()
  const del = trpc.invoices.delete.useMutation({ onSuccess: () => utils.invoices.invalidate() })
  const cardDel = trpc.cards.delete.useMutation({ onSuccess: () => utils.cards.invalidate() })
  const unregister = trpc.invoices.unregisterPayment.useMutation({
    onSuccess: () => {
      utils.invoices.invalidate()
      utils.transactions.invalidate()
      utils.dashboard.invalidate()
      utils.cards.invalidate()
    },
  })

  const [month, setMonth] = useState(currentMonth)
  const [cardFilter, setCardFilter] = useState<string | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [payingTarget, setPayingTarget] = useState<PaymentTarget | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [cardModalOpen, setCardModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CardItem | null>(null)
  const [toast, setToast] = useState<PaymentToast | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  function showToast(t: PaymentToast) {
    setToast(t)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 5000)
  }
  function dismissToast() {
    if (timer.current) clearTimeout(timer.current)
    setToast(null)
  }

  const rows = list.data ?? []
  const closedOf = (r: InvoiceRow) => isInvoiceClosed(toSchedule(r), toPayments(r))
  const filtered = cardFilter === 'all' ? rows : rows.filter((r) => r.cardId === cardFilter)
  const active = filtered.filter((r) => !closedOf(r))
  const closed = filtered.filter(closedOf)
  const heroRows = useMemo(
    () => filtered.map((r) => ({ schedule: toSchedule(r), payments: toPayments(r) })),
    [filtered],
  )
  const cardList = cards.data ?? []
  const selectedCard = cardList.find((c) => c.id === cardFilter) ?? null
  // No filtro de cartão específico o grupo fica mesmo vazio: o cabeçalho é a via de editar/excluir
  const activeGroups = cardList
    .filter((c) => cardFilter === 'all' || c.id === cardFilter)
    .map((card) => ({ card, rows: active.filter((r) => r.cardId === card.id) }))
    .filter((g) => cardFilter !== 'all' || g.rows.length > 0)
  const unlinked = cardFilter === 'all' ? active.filter((r) => !r.cardId) : []

  const cardProps = (row: InvoiceRow) => ({
    row,
    month,
    today,
    expanded: expandedId === row.id,
    onToggle: () => setExpandedId((cur) => (cur === row.id ? null : row.id)),
    onOpenPayment: (n: number) => setPayingTarget({ invoiceId: row.id, installmentNumber: n }),
    onDelete: () =>
      confirmDelete('Excluir fatura', `Excluir a fatura "${row.description || row.cardName}"?`, () =>
        del.mutate({ id: row.id }),
      ),
  })

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-4 pt-3">
        <View className="mb-4">
          <Button title="+ Nova fatura" onPress={() => setFormOpen(true)} />
        </View>

        {rows.length > 0 ? (
          <InvoiceMonthHero rows={heroRows} month={month} onMonthChange={setMonth} today={today} />
        ) : null}

        <CardStrip
          selected={cardFilter}
          onSelect={setCardFilter}
          onAddCard={() => {
            setEditingCard(null)
            setCardModalOpen(true)
          }}
        />

        {activeGroups.map(({ card, rows: groupRows }) => (
          <View key={card.id} className="mb-2">
            <View className="mb-2 flex-row items-center gap-2">
              <BankLogo preset={card.bankPreset} size={20} />
              <Text className="text-sm font-bold text-foreground dark:text-foreground-dark">
                {card.name}
              </Text>
              {selectedCard && selectedCard.id === card.id ? (
                <View className="ml-auto flex-row items-center gap-3">
                  <Pressable
                    hitSlop={6}
                    onPress={() => {
                      setEditingCard(card)
                      setCardModalOpen(true)
                    }}
                  >
                    <Ionicons name="pencil-outline" size={15} color="#9C9B9B" />
                  </Pressable>
                  <Pressable
                    hitSlop={6}
                    onPress={() =>
                      confirmDelete(
                        'Excluir cartão',
                        `Excluir o cartão "${card.name}"? Faturas e transações dele ficam sem cartão.`,
                        () => {
                          cardDel.mutate({ id: card.id })
                          setCardFilter('all')
                        },
                      )
                    }
                  >
                    <Ionicons name="trash-outline" size={15} color="#9C9B9B" />
                  </Pressable>
                </View>
              ) : null}
            </View>
            {groupRows.length > 0 ? (
              groupRows.map((row) => <InvoiceCard key={row.id} {...cardProps(row)} />)
            ) : (
              <Text className="text-xs text-muted dark:text-muted-dark">
                Nenhuma fatura ativa deste cartão.
              </Text>
            )}
          </View>
        ))}

        {unlinked.length > 0 ? (
          <View className="mb-2">
            {activeGroups.length > 0 ? (
              <Text className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted dark:text-muted-dark">
                Sem cartão
              </Text>
            ) : null}
            {unlinked.map((row) => (
              <InvoiceCard key={row.id} {...cardProps(row)} />
            ))}
          </View>
        ) : null}

        {rows.length === 0 ? (
          <EmptyState
            title="Nenhuma fatura"
            hint="Registre parcelamentos de cartão com valor, parcelas e primeiro vencimento."
          />
        ) : activeGroups.length === 0 && unlinked.length === 0 ? (
          <Text className="text-xs text-muted dark:text-muted-dark">
            Nenhuma fatura ativa neste filtro.
          </Text>
        ) : null}

        <ClosedInvoices rows={closed} showCard={cardFilter === 'all'} />
        <View className="h-16" />
      </ScrollView>

      {toast ? (
        <View className="absolute inset-x-4 bottom-6 rounded-2xl border-l-4 border-positive bg-foreground px-4 py-3.5">
          <Text className="text-xs font-black text-background">
            <Text className="text-positive">✓ </Text>
            {toast.text}
          </Text>
          <Text className="mt-1 text-[11px] tabular-nums leading-relaxed text-background/80">
            {toast.detail}
          </Text>
          <Pressable
            hitSlop={6}
            onPress={() => {
              unregister.mutate({ paymentId: toast.paymentId })
              dismissToast()
            }}
          >
            <Text className="mt-1.5 text-[11px] font-bold text-background underline">desfazer</Text>
          </Pressable>
        </View>
      ) : null}

      <InvoiceFormModal open={formOpen} onClose={() => setFormOpen(false)} />
      <CardFormModal
        open={cardModalOpen}
        editing={editingCard}
        onClose={() => setCardModalOpen(false)}
      />
      <InstallmentPaymentModal
        target={payingTarget}
        onClose={() => setPayingTarget(null)}
        onPaid={showToast}
      />
    </View>
  )
}
