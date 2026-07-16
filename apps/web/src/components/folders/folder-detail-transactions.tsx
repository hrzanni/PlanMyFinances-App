import { formatDate } from '@pmf/core'
import { Button, EmptyState, LoadingState, Table, Td, Th } from '@pmf/ui-web'
import { money } from '@/lib/format'
import { trpc } from '@/lib/trpc'

/** Transações completas da pasta, paginadas — sem precisar ir pro Histórico. */
export function FolderDetailTransactions({ folderId }: { folderId: string }) {
  const query = trpc.transactions.list.useInfiniteQuery(
    { folderId, limit: 50 },
    { getNextPageParam: (last) => last.nextCursor ?? undefined },
  )
  const items = query.data?.pages.flatMap((p) => p.items) ?? []

  if (query.isLoading) return <LoadingState />
  if (items.length === 0) {
    return <EmptyState title="Nenhuma transação nesta pasta" hint="Associe transações pelo formulário de nova transação." />
  }

  return (
    <div>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
        Transações ({items.length})
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Data</Th>
            <Th>Descrição</Th>
            <Th numeric>Valor</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((tx) => (
            <tr key={tx.id}>
              <Td className="whitespace-nowrap">{formatDate(tx.date)}</Td>
              <Td className="font-bold text-foreground">{tx.description ?? '—'}</Td>
              <Td numeric>
                <span className={tx.type === 'receita' ? 'font-bold text-positive' : 'font-bold text-negative'}>
                  {tx.type === 'receita' ? '+ ' : '− '}
                  {money(tx.value)}
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {query.hasNextPage ? (
        <Button
          type="button"
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          className="mt-3 w-full"
        >
          {query.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
        </Button>
      ) : null}
    </div>
  )
}
