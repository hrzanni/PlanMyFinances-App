# Fase 3 — Mobile (Expo / React Native) · Mapa de tarefas

> Detalhe a nível de passos será escrito quando chegarmos. Aqui ficam objetivo, entregáveis e dependências.

**Goal:** app Android em `apps/mobile` com paridade total à web e requisitos de memória atendidos (ME-001..004).

**Depende de:** Fase 1 (API/auth) e, idealmente, Fase 2 (padrões de UI e routers de domínio já criados e validados).

**Stack:** Expo + React Native + NativeWind, cliente tRPC + TanStack Query, Expo SecureStore.

**Princípio:** reusa `@pmf/core`, `@pmf/schemas`, `@pmf/types` e o tipo `AppRouter`. UI é nativa, separada da web. Memória controlada por design, não por acidente.

**Referência visual obrigatória:** protótipo aprovado em `docs/mockups/planmyfinances-telas.html` (telas mobile) + tema Nexforce.

| # | Subtarefa | Objetivo / entregável | Notas |
|---|---|---|---|
| 3.1 | Scaffold mobile | Expo + NativeWind + provider tRPC/TanStack Query; fonte Lato (expo-google-fonts); tokens do tema Nexforce claro/escuro | aponta para a mesma API |
| 3.2 | Auth mobile | login/signup/forgot/reset; token (bearer) em SecureStore; refresh (FR-063) | não usa cookie |
| 3.3 | Componentes base | equivalentes nativos: Button, Input, Card, Sheet, List, Tabs, Badge, Toggle | espelha `ui-web` em vocabulário |
| 3.4 | Memória | FlashList virtualizada (ME-001); paginação por mês/cursor (ME-002); `staleTime`/`gcTime` no TanStack Query (ME-003) | base transversal das listas |
| 3.5 | Navegação nativa | FR-050/151: 5 tabs (Início, Histórico, Fixos, Dash, Mais) + stack "Mais" (Pastas, Categorias, Cobranças, Faturas, Conexões, Agente, Sair); fluxo autenticado | redireciona não autenticado |
| 3.6 | Transações + Home | FR-001/002/003/107 nativo, com campo Pasta no form (FR-111) e widget gastos fixos | usa cursor de `listTransactionsInput` |
| 3.7 | Histórico | FR-004/113/125; filtros persistidos no estado de navegação (FR-005, equivalente mobile); badges de origem/pasta | sem URL; estado da rota |
| 3.8 | Categorias/Subcategorias | FR-010/011/012/140 (seções Despesas × Receitas) | |
| 3.9 | Gastos Fixos | FR-100..106: lista com toggle pago, seletor de mês, cards pago/pendente | paridade com a web |
| 3.10 | Pastas | FR-110..113: cards expansíveis com transações dentro | |
| 3.11 | Cobranças | FR-020..024 | status inline em sheet/lista |
| 3.12 | Faturas | FR-030..032 | |
| 3.13 | Dashboard | FR-006 com lib de gráficos RN (ex.: victory-native/react-native-svg) | cálculos em `@pmf/core` |
| 3.14 | Tela do Agente | FR-130/131: chat estático "Em breve" | sem backend |
| 3.15 | Build Android | EAS Build, gerar APK/AAB de teste e validar em device/emulador | iOS fica no backlog |

**Definition of Done da fase:** paridade funcional com a web em device Android; listas virtualizadas e paginadas (sem carregar base inteira); roteiro SC-009 (estendido) passa no mobile; build Android gerado.
