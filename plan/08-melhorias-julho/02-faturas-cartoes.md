# Tópico 2 — Faturas → Cartões

> Ver conflito com o Tópico 1 (Cobranças) no `README.md` da fase — mesmo componente de formulário hoje. Este tópico é uma mudança de modelo de dados, maior que os outros; recomendo uma rodada curta de decisão com o Hugo antes de um agente começar a codar (ver seção de decisões abaixo).

## Pedido original do Hugo

> Adicionar o cartao e cada transação pendente deve entrar dentro de um cartão. Já seria legal deixar uns pré-selecionados, como nubank e a foto do banco.

## Estado atual (mapeado em 2026-07-13)

- Hoje "fatura" é um registro avulso e autocontido: `invoices` (`apps/api/src/db/schema/installment-accounts.ts:33-56`) tem `cardName` (texto livre, sem entidade própria), `amountPerInstallment`, `totalInstallments`, `amountPaid`, `dueDate`, `status` (`invoiceStatus = ['pendente','pago']`). Não existe relação com transações — uma fatura não sabe quais transações a compõem.
- Não existe entidade "cartão" em nenhum lugar do schema. `bank_connections` (Pluggy) é sobre Open Finance, não sobre cadastro manual de cartão.
- Não existe nenhum catálogo de bancos/bandeiras nem asset de logo de banco no projeto (`assets/brand/` só tem a marca do próprio produto).
- Componente web `installment-form-fields.tsx` e mobile `installment-form-modal.tsx`/`installment-list.tsx` tratam cobrança e fatura como o mesmo conceito genérico (`kind: 'charge' | 'invoice'`) — ver Tópico 1.

## Decisão de produto em aberto — isto é uma mudança de modelo, não um ajuste de tela

O pedido implica trocar o conceito atual (fatura = registro manual de parcelamento) por: cartão = entidade própria (nome, banco, cor/ícone) → transações pendentes são associadas a um cartão → "fatura" passa a ser a agregação das transações de um cartão num período, não mais um registro digitado à mão. Isso muda o que "criar uma fatura" significa e o que acontece com faturas já existentes. Antes de um agente implementar, o Hugo precisa decidir:

1. **O que vira o registro de fatura:** (a) fatura deixa de ser uma tabela própria e passa a ser calculada on-the-fly a partir de `transactions.cardId` + mês de vencimento (mais simples, sem duplicar dado, mas perde o `amountPerInstallment`/`totalInstallments` de parcelamento — precisa decidir se parcelamento de compra no cartão continua existindo e como); ou (b) mantém uma tabela `invoices` ligada a `cardId`, e transações passam a apontar para a fatura (`invoiceId`) em vez de a fatura ser um registro solto — parcelamento continua existindo por fatura/compra.
2. **Bancos pré-selecionados:** um enum fixo (`nubank`, `itau`, `bradesco`, ...) com logo embutido como asset do projeto, ou texto livre com opção de logo genérico? Enum fixo exige adicionar os assets de logo (não existem hoje) e mantê-los atualizados; texto livre é mais simples mas sem logo automático para bancos fora da lista.
3. **Transação "pendente" de cartão:** hoje toda transação já existe independente de fatura. Precisa decidir se `cardId` é um campo novo direto em `transactions` (marcando que aquela despesa é "no cartão X, ainda não fechou a fatura") e como isso se relaciona com o campo `folderId` que já existe (são conceitos independentes, uma transação pode ter pasta E cartão ao mesmo tempo).

Recomendação: (1b) manter fatura como entidade com FK para cartão, permitindo que parcelamento continue existindo por fatura; (2) enum fixo com um punhado de bancos populares (Nubank primeiro, por ser o exemplo citado) + opção "outro" com ícone genérico, adicionando os assets conforme necessário; (3) `cardId` nullable direto em `transactions`. Confirmar com o Hugo antes de iniciar — isto é maior que um ajuste de UI e vale uma spec amendment curta em `docs/superpowers/specs/`, análoga à de gastos fixos/pastas.

## Mudança necessária (assumindo a recomendação acima, ajustar conforme decisão do Hugo)

**Schema/migration:**
- Tabela `cards` (`id`, `userId`, `name`, `bankPreset` enum nullable, `colorHex`/`iconKey`, `createdAt`).
- `invoices` ganha `cardId` FK (`onDelete: cascade` ou `set null`, a decidir).
- `transactions` ganha `cardId` FK nullable, análogo ao `folderId` existente.

**API:**
- Router `cards`: `list`/`create`/`update`/`delete`, filtrando por `userId` como todo domínio.
- Ajustar `invoices` para relacionar com `cardId`.
- Ajustar `transactions` create/update para aceitar `cardId`.

**Web/mobile:**
- Tela "Cartões" (nova ou substituindo parte de Faturas) — CRUD de cartão, seleção do preset de banco com logo.
- Form de transação ganha seleção de cartão (mesmo padrão do select de Pasta hoje).
- Tela de Faturas passa a listar por cartão + período.

## Critérios de aceite

- Existe uma tela para cadastrar cartões, com pelo menos um banco pré-selecionado (Nubank) mostrando logo.
- Uma transação pendente pode ser associada a um cartão no momento da criação.
- A tela de Faturas mostra as faturas agrupadas/relacionadas ao cartão correspondente.
- `pnpm lint/typecheck/test/build` verdes; migration testada localmente (Docker Postgres, porta 5439 conforme convenção do projeto).
