# Redesign da tela Fixos + widget "Fixos do mês" — design aprovado

Data: 2026-07-15 · Branch: `feat/fase8-redesign-fixos` · Status: aprovado pelo Hugo via mockups em localhost (variante C + widget opção 3 combinada).

## Problema

Com a adição de fixos de receita, a tela Fixos ficou confusa e pouco bonita: dois blocos de KPIs empilhados (6 cards na web), despesas e receitas misturadas na lista diferenciadas só por texto colorido, filtro em `<Select>`, tabela crua sem hierarquia. O widget "Fixos do mês" na Início era só duas linhas de texto. Escopo aprovado: redesign visual + melhorias funcionais leves, sem mudanças de backend.

## Decisão — Tela Fixos: "Agenda de vencimentos" (variante C)

### Estrutura (web e mobile, paridade total)

1. **Faixa de KPIs** — 4 células compactas num único card:
   - **Despesas fixas**: total mensal (`totals.expense.total`).
   - **Receitas fixas**: total mensal (`totals.income.total`).
   - **Saldo fixo do mês**: receitas − despesas, verde com `+` quando positivo, vermelho com `−` quando negativo.
   - **Pendências**: `N itens · R$ X` somando despesas pendentes + receitas a receber.
   - Web: grid de 4 colunas com divisores verticais. Mobile: grade 2×2 de cards compactos.
2. **Filtro por tipo em pills segmentadas** (substitui o `<Select>` da web e os chips atuais do mobile): `Todos (n) / Despesas (n) / Receitas (n)`, pill ativa invertida (bg foreground / texto background).
3. **Linha do tempo por vencimento** (substitui a tabela/lista): itens agrupados por `dueDay` crescente, cada grupo com uma bolinha do dia no trilho esquerdo (`dia` + `mês` abreviado) ligada por linha vertical.
   - Bolinha do dia atual invertida (bg foreground) com rótulo "hoje" — só quando o mês exibido é o mês corrente.
   - Item: ícone circular de tipo (↘ vermelho `negative/12` para despesa, ↗ verde `positive/12` para receita), nome em bold, categoria em muted, valor tabular colorido (receita com prefixo `+`), badge de status, toggle pago/recebido e ações editar/excluir.
   - Item pago/recebido: opacidade reduzida (~0.6), badge `Pago`/`Recebido`.
   - Item vencido: borda do card em `negative/45`, badge `Vencido há N dias`.
   - Badges relativas no mês corrente: `Vencido há N dias` / `Vence hoje` / `Em N dias`; em outros meses, absolutas: `pago em dd/mm`·`recebido em dd/mm` / `vencido` / `pendente`.
   - A marcação de pago continua pelo **Toggle** existente (mutations `pay`/`unpay`), como no resto do app; o botão "Pagar" que aparecia no mockup foi substituído pelo toggle para não duplicar ações.
4. **Demais elementos preservados**: header com MonthSelector e "+ Novo fixo", formulário atual (modal web / inline mobile), estados vazios, caixa informativa da virada de mês, rodapé mobile.

## Decisão — Widget "Fixos do mês" na Início (opção 3 combinada)

Mesmo card nas duas plataformas, substituindo o atual:

1. **Título + chip de saldo fixo** (pill verde `positive/12` com `+R$ X`; vermelha se negativo).
2. **Mini agenda**: as **3 próximas pendências** do mês exibido — itens com `monthlyStatus !== 'pago'` ordenados por `dueDay` (vencidos aparecem primeiro naturalmente), cada um com bolinha do dia (invertida se "hoje"), nome, categoria, valor colorido e badge relativa. Pagos não aparecem. Menos de 3 pendências → mostra as que houver; zero → estado "Tudo em dia ✓" no lugar da lista.
3. **Barras de progresso**: uma para Despesas (`2 de 5 pagas · R$ X pend.`) e uma para Receitas (`2 de 3 recebidas · R$ X a receber`). Preenchimento verde = valor pago/recebido sobre o total; segmento vermelho adicional = parcela vencida (despesas).
4. **Link "Ver todos →"** para a tela Fixos.
5. Sem fixos cadastrados → EmptyState atual.

## Arquitetura

- **Backend/API: nenhuma mudança.** `fixedExpenses.list` já devolve `items` (com `type`, `dueDay`, `monthlyStatus`, `payment`) e `totals` por tipo.
- **Lógica pura nova em `packages/core`** (com testes), consumida por web e mobile:
  - `fixedBalance(totals)` → saldo fixo (receitas − despesas) em centavos/number consistente com `fixedExpenseTotals`.
  - `fixedPendingSummary(items)` → `{ count, amount }` das pendências.
  - `groupFixedByDueDay(items)` → grupos ordenados por `dueDay` para a linha do tempo.
  - `fixedDueLabel(dueDay, referenceMonth, today)` → `{ kind: 'late' | 'today' | 'upcoming' | 'other-month', days }` para as badges relativas.
  - `nextPendingFixed(items, limit = 3)` → itens da mini agenda do widget.
- **Web**: `gastos-fixos/page.tsx` vira orquestração; UI extraída para `apps/web/src/components/fixed/` (`fixed-kpis.tsx`, `fixed-type-filter.tsx`, `fixed-timeline.tsx`, `fixed-timeline-item.tsx`). Widget novo `apps/web/src/components/fixed-month-widget.tsx` (padrão do `invoices-month-widget.tsx`). Respeitar 300 linhas/arquivo.
- **Mobile**: `fixos.tsx` vira orquestração; componentes em `apps/mobile/src/components/` (`fixed-kpis.tsx`, `fixed-timeline.tsx`), widget `fixed-month-widget.tsx`. Mesmos tokens (NativeWind espelha o tema).
- Cores/semântica: somente tokens existentes do tema Nexforce (positive/negative/attention/info, cor semântica em valores).

## Referências visuais

Mockups aprovados (scratchpad da sessão, servidos em localhost): `variante-c.html` (tela Fixos, com KPIs 2×2 no mobile) e `inicio-widget.html` seção "Opção 3 — Combinada".

## Testes e verificação

- Unit: funções puras novas em `packages/core` (agrupamento, saldo, pendências, labels relativas — casos: mês corrente/passado/futuro, vencido/hoje/futuro, sem pendências).
- Gates: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- Runtime: verificação visual web (browser) e mobile (bundle Metro) conforme skill `verify`, nos temas claro e escuro.
