# Tópico 5 — Início: logo da plataforma + gráfico de pizza por categoria

> Ver conflito com o Tópico 4 (Transações/tags) no `README.md` da fase — mesmo arquivo `apps/web/src/app/(app)/page.tsx`. Comece depois que o 4 tiver feito merge (ou mesmo agente para os dois).

## Pedido original do Hugo

> Adicionar a imagem da plataforma "Apenas o P" — no web colocar na sidebar, no celular ainda decidir onde. Mudar o gráfico "Saldo acumulado por dia" por um gráfico de pizza por categoria, também colocar o "sem categoria" como uma das porcentagens e valor.

## Parte A — Logo na sidebar (web)

### Estado atual
- `apps/web/src/components/sidebar.tsx:12-15` — o topo da sidebar é só texto (`Plan` + `My` + `Finances` em spans), sem nenhum slot de imagem.
- Asset candidato a "Apenas o P": `assets/brand/icone-quadrado.png` (2048×2048 RGBA, na raiz do monorepo). Também existe `assets/brand/logo-horizontal.png` (2752×1536, logo com texto — não é o que foi pedido).
- Nenhum dos dois está hoje em `apps/web/public/`; precisa ser copiado e otimizado (ver nota de tamanho abaixo) antes de referenciar via `<Image>`.
- Mobile: não existe hoje um header/topo equivalente à sidebar (`apps/mobile/app/(tabs)/_layout.tsx:30-73` usa `headerShown: false`, é bottom tab bar pura). O Hugo disse explicitamente que ainda não decidiu onde entra no mobile — **não implemente isso no mobile ainda, só web.**

### Mudança necessária
- Otimizar `icone-quadrado.png` para um tamanho de arquivo razoável (mesma técnica já usada para o ícone/favicon do app, achatando para poucos tons — ver `estado-implementacao` do projeto) e colocar em `apps/web/public/` (ex. `logo-p.png`).
- Trocar o bloco de texto em `sidebar.tsx:12-15` por logo + nome (ou só logo, a decidir com o Hugo por preferência visual — não é uma decisão técnica, pode perguntar rápido ou propor as duas opções lado a lado).

### Critérios de aceite
- Sidebar web mostra a logo "Apenas o P" no topo, nos temas claro e escuro (confirmar contraste).
- Nenhuma mudança no mobile neste tópico.

## Parte B — Gráfico de pizza por categoria

### Estado atual
- Gráfico atual: `apps/web/src/components/balance-line-chart.tsx` (Recharts `LineChart`), usado inline em `apps/web/src/app/(app)/page.tsx:144-154` — **não há um `month-charts-section.tsx` no web**, o bloco está direto na página (mesma página que o Tópico 4 mexe, ver conflito).
- Mobile: `apps/mobile/src/components/month-charts-section.tsx:12-28` compõe dois cards com SVG puro (sem lib, ver comentário ME-004 no arquivo) — `BalanceLineChart` e `BarsChart`, ambos em `apps/mobile/src/components/charts.tsx`. **Não existe `PieChart` SVG puro** — precisa ser criado do zero (arcos via `<Path>`), é o item tecnicamente mais trabalhoso deste tópico.
- Dado agregado por categoria **não existe hoje**: `apps/api/src/services/summary.ts` (`monthSummary`) seleciona só `{ type, value, date }`, sem `categoryId` e sem `groupBy`. `dashboardRouter.month` (`apps/api/src/trpc/routers/dashboard.ts:6-10`) expõe esse resultado.
- `packages/core/src/balance.ts` tem `monthlyBalance` e `accumulatedBalanceByDay`, mas nenhuma função de agregação por categoria.

### Decisão de produto em aberto — o que entra na pizza
O pedido fala em "sem categoria" como uma fatia, o que sugere agregação de **despesas** por categoria (padrão mais comum em apps financeiros; receita normalmente não se categoriza da mesma forma). Confirme com o Hugo:
- **Opção A (recomendada):** pizza só de despesas do mês, por categoria, incluindo fatia "sem categoria" (mesmo filtro `categoryId IS NULL` já usado em `apps/api/src/services/transactions.ts:19`).
- **Opção B:** pizza combinando receita e despesa por categoria (mistura dois tipos diferentes de valor na mesma pizza, mais confuso de ler).

### Mudança necessária (assumindo Opção A)
- **`packages/core`:** nova função pura `expenseByCategory(txs, categories)` (ou equivalente), com teste espelho em `*.test.ts`, seguindo o padrão de `accumulatedBalanceByDay`.
- **API:** `apps/api/src/services/summary.ts` — incluir `categoryId` no select e agregar despesas por categoria (incluindo `null` como "sem categoria"); expor no retorno de `monthSummary`/`dashboard.month`.
- **Web:** novo componente `pie-chart-by-category.tsx` (Recharts `PieChart`/`Pie`/`Cell`, já é dependência do projeto); substituir o bloco de `BalanceLineChart` em `page.tsx:144-154` pelo novo gráfico (mesmo arquivo do Tópico 4 — coordenar).
- **Mobile:** novo `PieChart` SVG puro em `charts.tsx`; `month-charts-section.tsx` passa a renderizá-lo no lugar (ou junto) do `BalanceLineChart` atual.

### Critérios de aceite
- Início (web e mobile) mostra um gráfico de pizza com despesas do mês agrupadas por categoria, incluindo fatia "sem categoria" com percentual e valor.
- Gráfico de linha "Saldo acumulado por dia" sai do lugar que a pizza ocupa (confirmar com o Hugo se deve sumir de vez ou mover para outro ponto da tela).
- `pnpm lint/typecheck/test/build` verdes, com teste novo da função de agregação em `packages/core`.
