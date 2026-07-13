# Fusão das telas Início e Dashboard — Design

> Supersede o conteúdo de FR-003 e FR-006 (doc `2026-06-25-planmyfinances-multiplatform-design.md`) e a lista de navegação de FR-151 (doc `2026-07-06-gastos-fixos-pastas-pluggy-design.md`) na parte referente a Dashboard/Dash.

## Contexto

Hoje `Início` e `Dashboard` são rotas separadas (web: `/` e `/dashboard`; mobile: tabs `inicio` e `dash`), com sobreposição de conteúdo (ambas mostram 3 KPIs e o gráfico de barras receitas × despesas) e duplicação de código:

- `trpc.dashboard.month.useQuery({ month })` chamado de forma idêntica em 4 arquivos (`page.tsx` web/mobile, `dashboard/page.tsx`, `dash.tsx`), sem hook compartilhado.
- Gráfico de linha do saldo acumulado (`dashboard/page.tsx:40-79`, web) é inline, ao contrário do gráfico de barras que já é componente (`income-expense-chart.tsx`).
- Seletor de mês do mobile Dashboard (`dash.tsx:19-29`) é reimplementado à mão em vez de existir como componente, ao contrário do web (`MonthSelector`).
- A Início mobile não tem nenhum gráfico, divergindo do FR-003 atual (que exige gráfico de barras na Home nas duas plataformas).

Objetivo: unificar as duas telas em uma só ("Início"), eliminando a rota/tab Dashboard, e aproveitar o trabalho para reduzir a duplicação acima.

## Decisão de produto

> **Emenda 2026-07-13 (remodelagem):** a versão inicial da fusão mantinha a seção de gráficos com seletor, KPIs e título próprios, e aceitava o gráfico de barras duplicado no web. Na prática isso deixou a Início cheia de informação repetida. Redesenho aprovado:
>
> 1. **Seletor de mês único no topo.** O indicador fixo do mês no cabeçalho da Início vira o `MonthSelector` ◀ ▶ e controla a tela inteira (KPIs, gastos fixos e gráficos). Não existe mais um segundo mês na tela.
> 2. **Seção de gráficos sem repetição.** Perde o título "Gráficos por mês", o seletor próprio e os 3 KPIs duplicados. No web fica só o gráfico de linha do saldo acumulado (o de barras já existe no topo); no mobile ficam os dois gráficos (linha + barras), pois o topo mobile não tem gráfico.
> 3. A "consequência aceita" abaixo (barras em dobro no web) fica **revertida**.

Redação original (histórico): `Início` passa a ter duas seções verticais —

1. **Seção fixa (topo)** — sem alteração de comportamento. Mês atual, não editável. KPIs, últimas transações, gastos fixos e (no web) o gráfico de barras, exatamente como hoje.
2. **Seção de gráficos (nova, abaixo, via scroll)** — o que hoje é a tela Dashboard. Seletor de mês editável, 3 KPIs do mês selecionado, gráfico de barras e gráfico de linha do saldo acumulado.

Consequência aceita ~(revertida pela emenda acima)~: no web, o gráfico de barras aparece duas vezes na página (fixo no topo + na seção de baixo, mês selecionável) porque nenhum gráfico existente é removido. No mobile não há esse efeito, porque a Início mobile não tinha gráfico algum — a fusão resolve de tabela a divergência de FR-003.

## Arquitetura

### Hook de dados compartilhado

Um hook por plataforma, `useMonthSummary(month: string)`:
- `apps/web/src/hooks/use-month-summary.ts`
- `apps/mobile/src/hooks/use-month-summary.ts`

Encapsula `trpc.dashboard.month.useQuery({ month })` e a derivação dos 3 KPIs (receitas, despesas, saldo). Após a emenda de 2026-07-13, o mês é um único estado da tela (controlado pelo `MonthSelector` do cabeçalho); no mobile a seção de gráficos repete a chamada com o mesmo mês e o TanStack Query deduplica pela query key.

### Componentes novos

> **Emenda 2026-07-13:** após a remodelagem, no web o `month-charts-section.tsx` foi removido — o card do gráfico de linha vive direto em `page.tsx`, alimentado pelo mesmo `useMonthSummary` do topo. No mobile o `MonthChartsSection` continua, mas recebe `month` por prop (sem estado nem seletor próprios). O `MonthSelector` de cada plataforma passou a ser usado no cabeçalho da Início.

- **Web**: `balance-line-chart.tsx`, extraído do inline atual em `dashboard/page.tsx:40-79`, para ficar consistente com `income-expense-chart.tsx`.
- **Mobile**: `apps/mobile/src/components/month-charts-section.tsx` (`MonthChartsSection`) — usa um novo `month-selector.tsx` (extraído do inline em `dash.tsx:19-29`) e os componentes já existentes `BarsChart`/`BalanceLineChart` de `charts.tsx`.

### Telas afetadas

- `apps/web/src/app/(app)/page.tsx`: mantém a seção fixa e passa a renderizar `<MonthChartsSection />` abaixo.
- `apps/mobile/app/(tabs)/inicio.tsx`: idem.
- `apps/web/src/app/(app)/dashboard/page.tsx`: removido.
- `apps/mobile/app/(tabs)/dash.tsx`: removido.

### Navegação

- Web: remove a entrada `{ href: '/dashboard', label: 'Dashboard' }` de `nav-items.tsx`.
- Mobile: remove a tab `dash` de `_layout.tsx` (comentário "5 tabs" passa a "4 tabs").

## Erros e loading

Sem mudança de comportamento: cada seção segue o padrão de loading/erro por query já usado hoje, só muda onde os componentes são montados na árvore.

## Testes

Não há teste automatizado referenciando `/dashboard` hoje (confirmado por busca no repo). A cobertura desta mudança será decidida no plano de implementação, conforme a suíte de testes de UI disponível no monorepo.

## Specs superseded

- **FR-003** (`2026-06-25-planmyfinances-multiplatform-design.md`): reescrito para descrever a Início com as duas seções (fixa + gráficos).
- **FR-006** (mesmo doc): removido — conteúdo absorvido pela nova redação de FR-003.
- **FR-151** (`2026-07-06-gastos-fixos-pastas-pluggy-design.md`): lista de navegação editada para remover Dashboard (web) e Dash (mobile).
- **FR-050** (doc de 25/06): não editado — já estava obsoleto desde a introdução de FR-151 e continua sem função normativa.
