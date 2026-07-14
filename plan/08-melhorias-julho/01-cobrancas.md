# Tópico 1 — Cobranças: editar status/recebido + virar receita

> Ver conflito com o Tópico 2 (Faturas/Cartões) no `README.md` da fase — mesmo componente de formulário hoje.

## Pedido original do Hugo

> Cobranças, nao consigo alterar o status da cobrança, nem o quanto foi recebido. Colocar que quando parte da cobrança for paga, conta como uma receita ('categoria especial' - cobrança).

## Estado atual (mapeado em 2026-07-13)

- Tabela `charges` já tem `amountPaid` (numeric) e `status` (enum `chargeStatus = ['pendente','cobrado','pago']`) — `apps/api/src/db/schema/installment-accounts.ts:7-30`.
- `updateChargeInput`/`updateCharge` **já aceitam** `status` e `amountPaid` — schema Zod (`packages/schemas/src/installment-accounts.ts:24-41`) e service (`apps/api/src/services/charges.ts:58-73`) já implementados. O bloqueio não é no backend.
- Nenhuma UI chama `charges.update`. A única edição usada é `setStatus` (`apps/web/src/app/(app)/cobrancas/page.tsx:122-139`, e equivalente mobile), que só muda o enum de status via `<Select>` — não existe campo para editar `amountPaid` em lugar nenhum.
- Não existe hoje nenhuma criação de transação a partir de cobrança. `setChargeStatus` é um update isolado, sem efeito colateral.
- Categorias (`apps/api/src/db/schema/categories.ts`) não têm nenhum conceito de "especial"/sistema/read-only — toda categoria é uma linha comum do usuário, editável e apagável.
- `txSource` (`apps/api/src/db/schema/enums.ts:4`) hoje é `['manual', 'fixed_expense', 'pluggy']` — não existe `'charge'`.
- Padrão de referência (Gastos Fixos, já implementado): `payFixedExpense`/`unpayFixedExpense` (`apps/api/src/services/fixed-expenses.ts:102-187`) fazem, dentro de `db.transaction`, o par insert em `transactions` + insert num registro de snapshot (`fixedExpensePayments`, com FK para a transação e índice único por mês, evitando pagar duas vezes). Esse é o modelo a espelhar aqui.

## Decisão de produto em aberto — como registrar "parte paga"

Hoje `amountPaid` é um único campo acumulado na própria linha de `charges` (sem histórico de quando/quanto foi recebido). Duas formas de resolver "editar o quanto foi recebido" gerando receita corretamente:

**Opção A — editar `amountPaid` livremente.** Um campo editável na tela que sobrescreve o valor total recebido. Para virar receita sem duplicar a cada edição, o sistema calcularia a diferença (delta) entre o valor novo e o antigo e lançaria só o delta como transação. Simples de fazer, mas frágil: se o valor for corrigido para baixo (erro de digitação), não há uma transação "negativa" óbvia para estornar, e não fica registro de quando cada parte foi recebida.

**Opção B (recomendada) — ação "Registrar recebimento"**, à parte da edição de status. O usuário informa um valor recebido agora (não o total); o sistema soma ao `amountPaid` existente e cria, numa única `db.transaction`, uma linha em `transactions` (receita) + uma linha numa tabela nova `charge_payments` (espelhando `fixed_expense_payments`: `id`, `chargeId`, `amount`, `transactionId`, `createdAt`). Isso dá histórico de recebimentos, permite "desfazer o último recebimento" (apaga o par payment+transaction, como `unpayFixedExpense` faz) e evita a ambiguidade de valor editado para baixo. Editar `status` continua sendo uma ação separada e simples (`setStatus`, já existe).

Confirme com o Hugo qual opção seguir antes de implementar. Recomendação: B, por espelhar o padrão já validado de Gastos Fixos e não exigir lógica de delta.

## Mudança necessária

**Schema/migration:**
- Adicionar `'charge'` ao enum `txSource`.
- Adicionar campo de sistema em `categories` (ex.: `isSystem boolean not null default false`) para marcar a categoria "Cobrança" como não editável/não apagável pelo usuário.
- Se Opção B: nova tabela `charge_payments` (`id`, `chargeId` FK, `amount` numeric, `transactionId` FK nullable `onDelete: set null`, `createdAt`).

**API:**
- Service: função `getOrCreateSystemCategory(db, userId, name, type)` idempotente (cria "Cobrança"/receita na primeira vez que o usuário registra um recebimento; reaproveita se já existir).
- Service: `registerChargePayment` (Opção B) espelhando `payFixedExpense` — transação de receita com `source: 'charge'`, `categoryId` da categoria especial, dentro de `db.transaction` junto com o insert em `charge_payments`; e `unregisterChargePayment` espelhando `unpayFixedExpense`.
- Router `charges`: nova procedure `registerPayment` (input: `{ id, amount }`) e `unregisterPayment` (input: `{ paymentId }` ou `{ id }` para o último).
- `updateCategory`/`deleteCategory`: bloquear (erro `FORBIDDEN`) quando `isSystem = true`.

**Web** (`apps/web/src/app/(app)/cobrancas/page.tsx`):
- Novo controle "Registrar recebimento" por cobrança (modal ou inline), chamando `charges.registerPayment`.
- Mostrar `amountPaid`/total e, se der, histórico de recebimentos.

**Mobile** (`apps/mobile/app/mais/cobrancas.tsx`, `installment-list.tsx`):
- Paridade da ação "Registrar recebimento".

## Critérios de aceite

- Dá para mudar o status de uma cobrança nas duas plataformas (já funciona hoje via `setStatus` — só confirmar que continua funcionando após as mudanças).
- Dá para registrar que parte de uma cobrança foi recebida, e isso cria uma transação de receita visível no Histórico/Início, na categoria "Cobrança".
- A categoria "Cobrança" não aparece como editável/apagável nas telas de Categorias.
- `pnpm lint/typecheck/test/build` verdes; testes novos em `packages/core` ou nos services cobrindo a idempotência do registro de recebimento (não pagar duas vezes o mesmo valor sem querer).
