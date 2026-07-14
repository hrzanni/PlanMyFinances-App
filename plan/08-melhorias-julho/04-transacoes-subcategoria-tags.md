# Tópico 4 — Adicionar transação: subcategoria + tags de categoria

> Ver conflito com o Tópico 5 (Início) no `README.md` da fase — mesmo arquivo `apps/web/src/app/(app)/page.tsx`. Termine este tópico e faça merge antes do 5 começar (ou mesmo agente para os dois).

## Pedido original do Hugo

> Adicionar transação: adicionar subcategoria também, depois de escolher a categoria. Deve aparecer uma tag com o nome da categoria e, se tiver, subcategoria também — isso no histórico e no card "Últimas transações" da tela Início.

## Estado atual (mapeado em 2026-07-13)

### Subcategoria no form — já existe no web, falta no mobile
- `transactions.categoryId` e `transactions.subcategoryId` já existem no schema (`apps/api/src/db/schema/transactions.ts:18-21`), no Zod (`packages/schemas/src/transactions.ts:9-10,18-19`) e no service/router (filtram e aceitam ambos).
- **Web já implementado:** `apps/web/src/components/transaction-form.tsx:31-34,140-155` — select de subcategoria aparece após escolher categoria, populado por `typeCategories.find(c => c.id === categoryId)?.subcategories`, resetado ao trocar categoria/tipo, enviado no `create.mutate`.
- **Mobile — gap real:** `apps/mobile/src/components/tx-form-modal.tsx` não tem select/chip de subcategoria (só chips de categoria, linhas ~103-116) e não envia `subcategoryId` no `submit()`. Portar o padrão do web (chips em vez de select, para manter consistência com o resto do form mobile).

### Tags de categoria/subcategoria — não existe em nenhuma plataforma
- Badges hoje só cobrem origem e pasta: `apps/web/src/components/tx-badges.tsx` tem `SourceBadge` e `FolderBadge`, sem `CategoryBadge`.
- Histórico web (`apps/web/src/app/(app)/historico/page.tsx:144-198`) e card "Últimas transações" da Início web (`apps/web/src/app/(app)/page.tsx:59-84`) não mostram categoria na linha, só como filtro.
- Mobile: `apps/mobile/src/components/tx-row.tsx:11-45` é o componente único reusado por Início, Histórico e Pastas (`app/(tabs)/inicio.tsx:50`, `app/(tabs)/historico.tsx:80-87`) — mexer nele cobre as três telas de uma vez.
- **O dado não vem resolvido:** `listTransactions` (`apps/api/src/services/transactions.ts:39-47`) retorna só `categoryId`/`subcategoryId` crus (uuid), sem nome. Não há join com `categories`/`subcategories` hoje.

## Decisão de produto em aberto — onde resolver o nome da categoria

**Opção A (recomendada) — join no backend.** Alterar `listTransactions` para trazer `categoryName`/`subcategoryName` (nullable) junto com cada transação, via join com `categories`/`subcategories`. Um único lugar resolve o dado para todos os clientes.

**Opção B — resolver no cliente**, buscando `trpc.categories.list` em cada tela que precisa exibir a tag e cruzando por id localmente. Duplica a lógica de lookup em 2 componentes web (Histórico, Início) e no `tx-row.tsx` mobile (usado em 3 telas); a Início web hoje nem busca `categories.list`, então seria uma query nova ali.

Recomendo A: menos duplicação, e o join é simples dado que a relação já existe. Confirme com o Hugo se preferir manter o cliente sem depender de mudança de shape na API (Opção B).

## Mudança necessária (assumindo Opção A)

**API:**
- `apps/api/src/services/transactions.ts` (`listTransactions`): incluir join com `categories`/`subcategories`, retornando `categoryName`/`subcategoryName` nullable ao lado de `categoryId`/`subcategoryId`.

**Web:**
- `apps/web/src/components/tx-badges.tsx`: novo `CategoryBadge({ categoryName, subcategoryName })`, formato "Categoria" ou "Categoria › Subcategoria".
- `apps/web/src/app/(app)/historico/page.tsx`: renderizar `CategoryBadge` na linha da tabela.
- `apps/web/src/app/(app)/page.tsx`: renderizar `CategoryBadge` em cada item do card "Últimas transações" (mesma seção que o Tópico 5 mexe — ver conflito no README).

**Mobile:**
- `apps/mobile/src/components/tx-form-modal.tsx`: adicionar chips de subcategoria após categoria escolhida, espelhando o padrão do web.
- `apps/mobile/src/components/tx-row.tsx`: adicionar badge de categoria/subcategoria (cobre Início, Histórico e Pastas de uma vez).

## Critérios de aceite

- Form de transação mobile mostra subcategoria depois de escolher categoria, com o mesmo comportamento de reset do web (RN correspondente, se houver).
- Histórico e card "Últimas transações" (web e mobile) mostram uma tag com nome da categoria e, se houver, subcategoria.
- Transações sem categoria não mostram tag quebrada (nem "undefined"/"null" na tela).
- `pnpm lint/typecheck/test/build` verdes.
