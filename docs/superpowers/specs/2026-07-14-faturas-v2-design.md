# Faturas v2 — unificação com Cartões, visão mensal e pagamento por parcela

Data: 2026-07-14 · Status: aguardando revisão do Hugo · Mockup aprovado: `2026-07-14-faturas-v2-mockup.html` (abrir no navegador; interativo)

## Contexto e objetivo

A fase 8.2 criou duas telas separadas, Cartões (`/cartoes`) e Faturas (`/faturas`), e a fatura guarda só um agregado `amount_paid`, sem noção de parcela individual, mês ou atraso. Esta evolução unifica tudo numa única tela **Faturas** (a navegação perde o item Cartões) e passa o controle para o nível da **parcela**: o usuário vê o que vence em cada mês, marca parcelas como pagas (gerando despesa automática no Histórico) e enxerga atrasos.

## Decisões de produto (aprovadas no mockup interativo)

1. Tela única `Faturas`; gerenciamento de cartões vive nela (faixa de tiles). Item "Cartões" sai da sidebar (web) e do menu Mais (mobile). Rota/tela `/cartoes` e `mais/cartoes` são removidas, sem redirect.
2. **Faixa de cartões como filtro:** primeiro tile "Todos os cartões", depois um tile por cartão (logo, nome, nº de transações, editar/excluir) e o tile "+ Cartão". Selecionar um cartão filtra a tela inteira. No mobile os tiles são chips compactos.
3. **Hero do mês (estilo Nubank):** painel escuro no topo com "A pagar em <mês>", valor, nº de parcelas em aberto, valor já pago e barra de progresso; ao lado, gráfico de barras de 12 meses (verde = pago, vermelho = em atraso, neutro = a vencer), barras clicáveis como filtro de mês. Mês corrente selecionado por padrão. Substitui os 3 KPIs atuais da tela.
4. **Parcelas individuais:** cada fatura expande (botão pill "parcelas" com chevron no web; rodapé "ver N parcelas" no card mobile — o glifo `▶` foi descartado) mostrando régua de chips numerados e lista por parcela com vencimento **sempre visível** (mesmo pagas; linha única no mobile), valor pago, status e ação.
5. **Estados por parcela:** `paga` (verde), `pendente` (âmbar), `em atraso` (vermelho) quando não paga e vencimento < hoje, valendo tanto para mês passado quanto para o mês corrente. Atraso aparece: badge da fatura ("venceu dia N"), linha vermelha global no hero ("⚠ N parcelas em atraso · R$ X", somando qualquer mês), segmento vermelho nas barras, chip/lista da parcela e subtítulo do dialog.
6. **Badge do mês selecionado** em cada fatura: "paga ✓" / "vence dia N" / "venceu dia N" / "sem parcela".
7. **Dialog de pagamento** (por chip ou link "registrar pagamento"/"editar"): status Paga pré-selecionado, **valor pré-preenchido com o valor da parcela** (editável, com nota "ajuste se pagou diferente"), data do pagamento (default hoje) e aviso prévio da despesa automática. Bottom sheet no mobile.
8. **Despesa automática:** marcar parcela como paga cria uma despesa no Histórico; a categoria vem do **campo Categoria da própria fatura** (escolhido ao criar/editar a fatura — decisão do Hugo: não usar categoria de sistema "Fatura", pois mataria os insights de gasto por categoria). Toast de confirmação com valor, descrição, categoria, cartão, data e ação "desfazer".
9. **Faturas encerradas** (todas as parcelas pagas) saem dos grupos e vão para uma seção recolhida "Faturas encerradas (N)" no fim, expansível, funcionando na visão geral (com coluna Cartão) e filtrada por cartão. Mesmo padrão no mobile.
10. **Widget "Faturas do mês" na tela Início** (web e mobile): valor a pagar no mês corrente, progresso pago/total, alerta de atraso, lista das parcelas do mês ordenadas por vencimento (vencidas em vermelho) e link "ver todas →" para /faturas. Estado vazio: "✓ Faturas do mês em dia".

## Modelo de dados (Drizzle + migration)

### `invoices` (alterações)

- `category_id uuid` → FK `categories(id)` on delete set null, **nullable** (consistente com transações sem categoria). Form de criar/editar fatura ganha o campo (categorias de despesa).
- `first_due_date date not null` → âncora do cronograma; parcela _n_ vence em `first_due_date + (n-1) meses`. Backfill: `COALESCE(due_date, created_at::date)`.
- `due_date` é **removida** (o vencimento exibido passa a ser derivado: próxima parcela em aberto).
- `amount_paid` e `status` continuam existindo como agregados, mas recalculados a partir dos pagamentos (fonte da verdade nova). `status = 'pago'` quando todas as parcelas têm pagamento.

### `invoice_payments` (nova tabela — espelho de `charge_payments` da 8.1)

| coluna | tipo | regra |
|---|---|---|
| id | uuid pk | |
| user_id | uuid | FK users, cascade |
| invoice_id | uuid | FK invoices, cascade |
| installment_number | integer | 1..total_installments; **unique(invoice_id, installment_number)** |
| amount | numeric(12,2) | valor efetivamente pago |
| paid_on | date | data do pagamento |
| transaction_id | uuid | FK transactions, set null (despesa gerada) |
| created_at | timestamptz | |

Pagamentos **não precisam ser contíguos** (pagar a 3 antes da 2 é permitido); a UI deriva o estado de cada parcela dos rows existentes. Atualizar `apps/api/src/test/test-db.ts` com a DDL.

## Lógica pura (`packages/core`, sem banco/framework)

Novo módulo `invoice-installments.ts` (+ testes), matemática em centavos como `charge-payments.ts`:

- `installmentDueDate(firstDueDate, n)` — vencimento da parcela n (meses somados com clamp de fim de mês).
- `installmentForMonth(invoice, 'YYYY-MM')` — nº da parcela que vence no mês, ou null.
- `isInstallmentOverdue(dueDate, isPaid, today)`.
- `monthSummary(rows, month, today)` — `{ due, paidAmt, overdue, nPend, nPaid }` para hero, barras e widget.

## API (tRPC)

Router `invoices` (schemas em `packages/schemas`):

- `list` — passa a retornar `categoryId`, `categoryName`, `firstDueDate` e o array de parcelas pagas (`payments: {installmentNumber, amount, paidOn, id}[]`), para a UI derivar chips/badges sem N+1.
- `create`/`update` — ganham `categoryId` (opcional) e `firstDueDate` (obrigatório no create).
- `registerInstallmentPayment({id, installmentNumber, amount, paidOn})` — valida dono e faixa da parcela; CONFLICT se a parcela já tem pagamento; `db.transaction`: insere despesa + row de pagamento + recalcula `amount_paid`/`status`. Sentinelas de service (null/'conflict'/'invalid_installment') mapeadas no router, padrão da 8.1.
- `updateInstallmentPayment({paymentId, amount, paidOn})` — atualiza pagamento e a despesa vinculada.
- `unregisterInstallmentPayment({paymentId})` — o "desfazer": apaga pagamento + despesa, reverte agregados ('pago' → 'pendente').
- `summary` atual é removido: como `list` passa a carregar cronograma (`firstDueDate`, `totalInstallments`) e pagamentos, **hero, barras dos meses, badges, atrasos e o widget do Início são derivados no cliente** com as funções puras de `@pmf/core` — as mesmas no web e no mobile. Nenhum endpoint novo de agregação.

### Despesa automática (regras)

- `type: 'despesa'`, `value` = valor informado no dialog, `date = paid_on`, `description: '"<descrição da fatura>" — parcela n/total'`, `categoryId` = da fatura (pode ser null), `cardId` = da fatura, `source: 'invoice'` (**novo valor no enum `tx_source`**; badge "fatura" em `tx-badges.tsx` web e `tx-row.tsx` mobile).

## UI (paridade web/mobile, visual do mockup)

- Web: `faturas/page.tsx` orquestra; extrair componentes novos para respeitar 300 linhas/arquivo: `card-strip.tsx` (faixa/filtro), `invoice-month-hero.tsx` (hero + barras), `installments-panel.tsx` (chips + lista), `installment-payment-dialog.tsx` (dialog + toast), `closed-invoices.tsx`; `invoice-table.tsx` adaptado (expander, badge do mês, mini-barra de progresso). `cartoes/page.tsx` e item de nav removidos; `card-form-dialog.tsx`/`bank-logo.tsx` reutilizados.
- Mobile: espelhos em `apps/mobile/src/components/` (`card-strip.tsx`, `invoice-month-hero.tsx`, `installment-*`), `app/mais/faturas.tsx` reescrita, `app/mais/cartoes.tsx` + item do menu Mais + título no `_layout` removidos. Toast mobile como overlay no rodapé.
- Início: widget novo (componente extraído, ex. `invoices-month-widget.tsx`) consumindo `invoices.list` + derivação via `@pmf/core`, plugado em `apps/web/src/app/(app)/page.tsx` e `apps/mobile/app/(tabs)/index.tsx`.
- Estética aprovada: hero escuro com barras, tiles com seleção por anel, pills de status (verde/âmbar/vermelho), expander com chevron SVG rotativo, numerais tabulares, animações discretas de entrada. Verde/vermelho apenas em valores/estados, paleta Nexforce.

## Fora de escopo

Valores diferentes por parcela na criação; juros/multa por atraso; notificação de vencimento; parcelas não mensais; importação automática de fatura (Pluggy).

## Testes e gates

- Core: unit de `invoice-installments` (cronograma com viradas de ano/fim de mês, monthSummary, overdue, centavos).
- API (pglite): register/update/unregister (despesa criada/atualizada/apagada, agregados recalculados, status), CONFLICT de parcela duplicada, validação cross-user (fatura, pagamento), categoria da fatura aplicada na despesa, encerradas via status.
- Gates: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` + verificação manual no navegador (web) e bundle Metro (receita `.claude/skills/verify/SKILL.md`).
- `run_tasks.md`: registrar como evolução da 8.2 (changelog ISO).
