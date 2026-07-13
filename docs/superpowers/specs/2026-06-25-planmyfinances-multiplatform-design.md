# Spec — PlanMyFinances (Multiplataforma: Web + Mobile)

> Documento de especificação para construir o PlanMyFinances do zero, com paridade total entre web e mobile.
> Substitui a tecnologia da spec anterior (`rebuild-spec.md`), preservando o domínio funcional.
> Idioma: UI/docs/commits em PT-BR; código (variáveis, funções, arquivos, tabelas) em EN.
> Convenções RFC 2119: MUST (obrigatório), SHOULD (recomendado), MAY (opcional).
> Data: 2026-06-25.

---

## Contexto e objetivo (OPMAX)

- **Objetivo:** um app de gestão de finanças pessoais com as mesmas funcionalidades na web e no mobile (Android primeiro, iOS depois), construído com fundação que sustenta um futuro agente conversacional (WhatsApp/Telegram) sem retrabalho.
- **Plano:** API única como fonte da verdade, dois clientes (web e mobile) consumindo a mesma API em monorepo TypeScript, lógica de negócio em pacotes neutros.
- **Métricas de sucesso:** ver seção *Success Criteria*.
- **Ação:** esta spec → plano de implementação → execução em sessões separadas.

A spec anterior tinha o domínio funcional bem definido, mas estava acoplada a um padrão exclusivo de web (Next.js Server Components + Server Actions + Auth.js por cookie). Esse padrão não atravessa para mobile nem para um agente. Esta spec move a lógica para uma API standalone, mantendo intactos os FRs e RNs funcionais.

---

## Decisões de arquitetura (travadas)

| Camada | Escolha | Justificativa |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | um repo, cache de build, código compartilhado entre clientes |
| API | tRPC sobre Fastify | typesafety ponta a ponta web↔mobile↔servidor, sem codegen; fonte única da verdade |
| Web | Next.js (App Router) como frontend consumindo a API | reaproveita ecossistema React; sem lógica de negócio acoplada ao Next |
| Mobile | React Native + Expo + NativeWind | mesma linguagem (TS) da web, compartilha tipos/validação/cálculos; Expo simplifica build Android→iOS |
| Banco | Postgres (Neon) + Drizzle ORM | leve, SQL-first, tipos bons; serverless |
| Auth | Better Auth | self-hosted, cookie na web + token (JWT) no mobile, usuários no próprio Postgres; suporta API keys para o futuro agente |
| Validação | Zod em `packages/schemas` | mesma validação na API e nos dois clientes (DRY) |
| Estado de servidor (clientes) | TanStack Query | cache com expiração, paginação, controle de memória no mobile |
| CI | GitHub Actions | lint → typecheck → testes → build |
| Qualidade | GitHub Actions + SonarCloud (repo público) | Quality Gate cobra duplicação, complexidade, cobertura e security hotspots |

### Estrutura do monorepo

```
planmyfinances/
├── apps/
│   ├── api/       → API tRPC (Fastify) + Better Auth + Drizzle. Fonte da verdade.
│   ├── web/       → Next.js, consome a API via cliente tRPC
│   └── mobile/    → Expo (React Native), consome a API via cliente tRPC
├── packages/
│   ├── core/      → cálculos de domínio puros (saldo, total/restante, "vence este mês")
│   ├── schemas/   → schemas Zod de input/output, compartilhados
│   ├── types/     → tipos de domínio compartilhados
│   └── ui-web/    → componentes web reutilizáveis (shadcn/ui sobre Tailwind)
├── .github/workflows/
│   ├── ci.yml
│   └── sonar.yml
├── sonar-project.properties
├── turbo.json
└── package.json (workspace root)
```

> Mobile e web NÃO compartilham componentes de UI (RN e DOM são incompatíveis). Compartilham `core`, `schemas`, `types` e o cliente tRPC. UI é separada por plataforma.

### Fluxo de dados

```
Cliente (web/mobile)
  → cliente tRPC (tipos inferidos do servidor)
  → procedure tRPC (apps/api)
     → valida input com Zod (packages/schemas)
     → valida sessão/token (Better Auth)
     → service de domínio (filtra por user_id)
     → cálculo (packages/core)
     → Drizzle → Postgres
  ← resposta tipada
Cliente cacheia via TanStack Query (com expiração)
```

Regra inviolável: **nenhum cliente acessa o banco direto.** Toda leitura e escrita passa pela API. Isso é o que torna o futuro agente trivial: ele é só mais um cliente da mesma API.

---

## Regras de Engenharia (invioláveis)

- RE-001: **Máximo de 300 linhas por arquivo.** Arquivo que ultrapassar MUST ser quebrado em módulos menores. SHOULD existir skill em `.claude/skills/` cobrindo esta e outras regras.
- RE-002: **Modularização.** Cada responsabilidade em seu arquivo: service (leitura/escrita), procedure tRPC (endpoint), schema (validação), cálculo (core), componente (UI). Nada de "arquivo faz-tudo".
- RE-003: **DRY.** Formatação de moeda/data, cálculos de total/restante/saldo, validações e queries por `user_id` MUST ser extraídos para módulo único e reutilizados. O SonarCloud Quality Gate cobra duplicação automaticamente.
- RE-004: Componentes de UI reutilizáveis vivem em um lugar por plataforma (`packages/ui-web` na web; pasta de componentes própria no mobile) e são consumidos por todas as telas daquela plataforma.
- RE-005: Utilitários compartilhados (formatCurrency, formatDate, cálculo de período do mês) vivem em `packages/core`, importados onde necessário.
- RE-006: **Cálculo de domínio é puro e testável.** Toda regra de negócio (RN-*) vive em `packages/core` como função pura, sem dependência de banco, framework ou rede. Os clientes e a API consomem essas funções.

---

## Modelo de dados (Drizzle / Postgres)

Todas as tabelas de domínio MUST ter `user_id` (FK → `users.id`). Datas como tipo `date`. Valores monetários como `numeric(12,2)` (nunca float). IDs como `uuid` (default `gen_random_uuid()`). `created_at` como `timestamptz default now()`.

> Mudança vs spec anterior: nomes de tabela normalizados para EN. `faturas` → `invoices`, `assinaturas` → `subscriptions`. A justificativa antiga (consistência com schema legado) não se aplica, pois o schema é novo.

### users (Better Auth)

Schema do adapter Drizzle do Better Auth (`users`, `sessions`, `accounts`, `verification` ou equivalentes da versão) com email/senha. Senhas com hash gerenciado pelo Better Auth (nunca texto puro).

### categories
`id`, `user_id` (FK users), `name` (text, NOT NULL), `type` (`'receita' | 'despesa'`, NOT NULL).

### subcategories
`id`, `user_id` (FK users, NOT NULL), `category_id` (FK categories, NOT NULL), `name` (text, NOT NULL).

### transactions
`id`, `user_id`, `type` (`'receita' | 'despesa'`), `value` (numeric(12,2), NOT NULL, > 0), `description` (text, nullable), `category_id` (FK categories, nullable), `subcategory_id` (FK subcategories, nullable), `date` (date, NOT NULL), `created_at`.

### charges (cobranças — a receber)
`id`, `user_id`, `debtor_name` (text, NOT NULL), `description` (nullable), `amount_per_installment` (numeric(12,2), NOT NULL, > 0), `total_installments` (int, NOT NULL, >= 1), `amount_paid` (numeric(12,2), NOT NULL, default 0, >= 0), `due_date` (date, nullable), `status` (`'pendente' | 'cobrado' | 'pago'`, default `'pendente'`), `created_at`.
**CHECK**: `amount_paid <= amount_per_installment * total_installments`.

### invoices (faturas — a pagar)
`id`, `user_id`, `card_name` (text, NOT NULL), `description` (nullable), `amount_per_installment` (numeric(12,2), NOT NULL, > 0), `total_installments` (int, NOT NULL, >= 1), `amount_paid` (numeric(12,2), NOT NULL, default 0, >= 0), `due_date` (date, nullable), `status` (`'pendente' | 'pago'`, default `'pendente'`), `created_at`.
**CHECK**: `amount_paid <= amount_per_installment * total_installments`.

### subscriptions (assinaturas — recorrências mensais)
`id`, `user_id`, `name` (text, NOT NULL), `amount` (numeric(12,2), NOT NULL, > 0), `due_day` (int, nullable, 1–31, informativo), `status` (`'ativo' | 'cancelado'`, default `'ativo'`), `created_at`.

### Relações e deleção
- `subcategories.category_id` → `categories.id`: **ON DELETE CASCADE**.
- `transactions.category_id` / `transactions.subcategory_id`: **ON DELETE SET NULL** (transações sobrevivem; viram "sem categoria").
- Demais FKs de domínio → `users.id`: **ON DELETE CASCADE**.

---

## Domínios e Funcionalidades

Os FRs abaixo descrevem comportamento, independente de plataforma. Cada FR vira uma ou mais procedures tRPC na API e telas equivalentes na web e no mobile (paridade total).

### Transações
- FR-001: O sistema MUST permitir criar, editar e excluir transações `receita`/`despesa`, com `value`, `date` (default hoje), `description?`, `category_id?` e `subcategory_id?`.
- FR-002: O formulário MUST filtrar categorias pela `type` selecionada e carregar subcategorias da categoria escolhida.
- FR-003: A Home MUST exibir, numa seção fixa no topo (mês corrente, não editável), as 5 transações mais recentes (`date DESC, created_at DESC`), 3 cards do mês corrente (receitas, despesas, saldo) e gráfico de barras receitas × despesas do mês; e, numa seção de gráficos abaixo (acessível por scroll), MUST ter seletor de mês, 3 cards do mês selecionado, gráfico de barras receitas × despesas e gráfico de linha do saldo acumulado por dia do mês selecionado. *(Redação atualizada em 2026-07-10, ver `2026-07-10-fusao-inicio-dashboard-design.md`; absorve o conteúdo do antigo FR-006.)*
- FR-004: O Histórico MUST listar transações com filtros independentes e cumulativos (`type`, `category_id`, `subcategory_id`, `date_from`, `date_to`) e permitir excluir.
- FR-005: Na web, os filtros do Histórico MUST persistir na URL (query params). No mobile, MUST persistir no estado de navegação da tela (equivalente funcional).
- FR-006: *(removido em 2026-07-10 — conteúdo absorvido por FR-003, ver `2026-07-10-fusao-inicio-dashboard-design.md`. Não existe mais tela/rota Dashboard separada.)*

### Categorias e Subcategorias
- FR-010: CRUD de categorias (`name`, `type`) e subcategorias (`name`, vinculadas a categoria).
- FR-011: Excluir categoria MUST apagar subcategorias (cascade) e setar `category_id`/`subcategory_id` das transações afetadas para NULL.
- FR-012: Subcategorias MUST pertencer ao usuário (`user_id`), isoladas diretamente.

### Cobranças (charges — a receber)
- FR-020: CRUD com `debtor_name`, `description?`, `amount_per_installment`, `total_installments`, `due_date?`, `amount_paid` (default 0), `status` (`pendente`/`cobrado`/`pago`).
- FR-021: Calcular `total = amount_per_installment * total_installments` e `restante = total - amount_paid`.
- FR-022: 3 cards: "A receber" (soma de `restante` onde `status ≠ pago`); "Vence este mês" (soma de `restante` onde `status ≠ pago` e `due_date` no mês/ano corrente); "Total recebido" (soma de `amount_paid`).
- FR-023: Mudança de status inline na tabela/lista (transições livres).
- FR-024: Rejeitar `amount_paid > total` (validação no form + CHECK no banco).

### Faturas (invoices — a pagar)
- FR-030: CRUD com `card_name`, `description?`, `amount_per_installment`, `total_installments`, `due_date?`, `amount_paid` (default 0), `status` (`pendente`/`pago`).
- FR-031: Cards análogos: "Em aberto" (restante onde `status = pendente`); "Vence este mês"; "Total pago".
- FR-032: Mesma validação `amount_paid <= total`.

### Assinaturas (subscriptions)
- FR-040: CRUD com `name`, `amount` (mensal), `due_day?` (1–31, informativo), `status` (`ativo`/`cancelado`).
- FR-041: Total mensal = soma de `amount` onde `status = ativo`. Catálogo informativo; NÃO gera transações automáticas.

### Navegação / Layout
- FR-050: O app autenticado MUST oferecer navegação para: Início, Histórico, Dashboard, Categorias, grupo "Contas" (Cobranças, Faturas) e Sair. Web via sidebar; mobile via navegação nativa (tabs/drawer).

---

## Auth & Permissões (Better Auth)

- FR-060: O sistema MUST suportar signup (email/senha), login, logout e recuperação de senha.
- FR-061: Senhas MUST ser armazenadas com hash (gerenciado pelo Better Auth); nunca em texto puro.
- FR-062: Recuperação de senha MUST usar token por email (Resend). O fluxo de reset valida o token, grava a nova senha e invalida o token.
- FR-063: **Web** autentica por cookie de sessão. **Mobile** autentica por token (access + refresh) armazenado em storage seguro do dispositivo (Expo SecureStore). Ambos resolvidos pelo Better Auth.
- FR-064: A API MUST proteger toda procedure de domínio exigindo sessão/token válido. Procedures públicas restritas a: signup, login, forgot-password, reset-password.
- FR-065: Usuário autenticado que acessa tela de auth MUST ser redirecionado para a Home.

### Isolamento de dados (defense-in-depth)
- FR-070: Toda leitura/escrita em tabela de domínio MUST filtrar por `user_id` da sessão/token, na camada de services. Nenhum dado de um usuário vaza para outro.
- FR-071: Toda procedure de mutação MUST validar a identidade antes de executar; sem identidade → erro de não autorizado.
- AC: Dado o usuário A autenticado, quando consulta/edita um registro do usuário B por id, então o sistema retorna vazio/erro e nunca os dados de B.

### Modo DEV
- FR-080: Em desenvolvimento local, o sistema MAY oferecer bypass de auth via `AUTH_BYPASS=true`, injetando um usuário dev fixo provisionado pelo seed.
- FR-081: O bypass MUST ser impossível em produção: helper retorna `false` se `NODE_ENV=production`; e o build/start da API aborta se a flag estiver ligada em produção.
- FR-082: Indicador "DEV MODE" MUST aparecer nos clientes quando o modo está ativo; eventos dev logados com prefixo `[DEV MODE]`.

> Nota: o modo DEV foi simplificado vs a spec anterior (de 4 guards de middleware web para guards de runtime + build na API). Os guards de hostname do `proxy.ts` antigo não se aplicam, pois não há mais middleware Next protegendo rotas; a proteção agora é na API.

---

## Regras de Negócio (em `packages/core`, como funções puras)

- RN-001: Saldo do mês = `SUM(receitas) - SUM(despesas)` para transações em `[primeiro_dia_mes, ultimo_dia_mes]`. Calculado no servidor.
- RN-002: "Mês corrente" baseado na data do servidor.
- RN-003: `total = amount_per_installment * total_installments`; `restante = total - amount_paid`.
- RN-004: `amount_paid` MUST estar em `[0, total]` (validação + CHECK banco).
- RN-005: "Vence este mês" considera só registros com `status ≠ pago` (cobrança) / `status = pendente` (fatura) e `due_date` no mês/ano corrente; sem `due_date` não entra.
- RN-006: Transições de status livres (sem máquina de estados).
- RN-007: Categoria tem `type`; subcategoria herda da categoria pai.
- RN-008: `due_date` e `date` podem estar no passado; MUST ser data válida.
- RN-009: Assinatura não gera transação automática; total mensal ativo = soma de `amount` onde `status = ativo`.

> Decisão consciente herdada: cobranças/faturas rastreiam apenas `amount_paid` agregado, não parcela individual. Mantido por simplicidade nesta versão.

---

## Consumo de memória no mobile (requisitos)

- ME-001: Listas (transações, histórico, cobranças, faturas) MUST ser virtualizadas (FlashList ou equivalente), renderizando só o visível.
- ME-002: Dados MUST ser paginados/escopados por mês ou página. O cliente NUNCA carrega a base inteira de transações de uma vez.
- ME-003: Cache de servidor via TanStack Query com `staleTime`/`gcTime` definidos, descartando dados não usados em vez de acumular estado infinito.
- ME-004: Imagens/assets otimizados; sem dados pesados desnecessários em memória.

---

## UI / Design

- FR-090: A UI web MUST usar shadcn/ui sobre Tailwind, com a skill `frontend-design` para qualidade visual. O mobile MUST usar NativeWind, mantendo vocabulário de estilo consistente com a web.
- FR-091: Conjunto de componentes reutilizáveis por plataforma cobrindo: Button, Input, Select, Card, Dialog/Modal, Table/List, Tabs, Badge. Sem duplicar estilos inline.
- FR-092: Formulários abrem como modal/sheet reutilizável.
- FR-093: Valores monetários em `pt-BR`/BRL; datas DD/MM/YYYY. Verde para entradas, vermelho para saídas.
- FR-094: A web MUST ser responsiva. O mobile MUST seguir padrões nativos de navegação.
- SHOULD: tokens de tema (cores, spacing, radius) e tema claro/escuro consistente nas duas plataformas.

---

## CI/CD e Qualidade (GitHub Actions)

### Action 1 — CI (`.github/workflows/ci.yml`)
- CI-001: Dispara em push na `main` e em todo Pull Request.
- CI-002: Usa pnpm + cache do Turborepo para velocidade.
- CI-003: Executa, em ordem, falhando o PR em qualquer falha: install → lint → typecheck → testes (Vitest) → build (todos os apps/packages).

### Action 2 — Qualidade (`.github/workflows/sonar.yml` + `sonar-project.properties`)
- CI-010: Dispara nos mesmos eventos.
- CI-011: Roda testes com cobertura (lcov) e envia análise + cobertura para o **SonarCloud** (repo público, token em secret `SONAR_TOKEN`).
- CI-012: O **Quality Gate** do SonarCloud reprova o PR se: cobertura cair abaixo do limite definido, surgir novo bug, vulnerabilidade, security hotspot não revisado, ou duplicação acima do limite.
- CI-013: O Quality Gate é o mecanismo automático que cobra RE-001 (tamanho/complexidade) e RE-003 (duplicação).

---

## Error Handling

| Falha | Comportamento ao usuário | Notas |
|---|---|---|
| Login inválido | "Email ou senha inválidos" | sem revelar qual campo |
| Sessão/token ausente em tela protegida | Redirect para login | guard no cliente + API |
| Procedure sem identidade | Erro "Não autorizado" | nunca executa mutação |
| `amount_paid > total` | Erro de validação, submit bloqueado | + CHECK no banco como rede |
| Falha de query/DB | "Erro ao carregar/salvar", log no servidor | sem expor detalhes internos |
| Token de reset inválido/expirado | "Link inválido ou expirado, solicite novo" | token consumido após uso |
| Perda de conectividade (mobile) | Estado de erro com opção de retry | TanStack Query gerencia retry/cache |

---

## Edge Cases

- Mês sem transações: cards zerados, gráficos vazios sem quebrar.
- Transação com categoria depois excluída: "sem categoria" (`category_id` NULL).
- Cobrança/fatura sem `due_date`: não entra em "vence este mês".
- `total_installments = 1`: parcela única.
- Filtros combinados sem resultado: lista vazia com estado claro.
- Concorrência: após mutação, o cliente MUST invalidar o cache da query afetada (TanStack Query) para não dessincronizar.
- Acesso a registro de outro usuário por id manipulado: bloqueado pelo filtro `user_id`.
- Mobile offline: leitura serve cache; mutação falha com retry, sem corromper estado.

---

## Constraints

- Tech travada: pnpm + Turborepo; tRPC + Fastify; Next.js (web); Expo + React Native + NativeWind (mobile); Drizzle + Neon Postgres; Better Auth; Zod; TanStack Query; Recharts (web) e equivalente RN para gráficos no mobile; Resend (email).
- Idioma: UI/commits/docs PT-BR; código/tabelas EN.
- Segurança: nenhum segredo no bundle do cliente (sem `NEXT_PUBLIC_`/`EXPO_PUBLIC_` para secrets); tokens do mobile em SecureStore; filtro `user_id` obrigatório em toda query de domínio.
- Nenhum cliente acessa o banco direto; tudo via API.

---

## Backlog (fora desta spec, ganchos já reservados)

- **AG-001: Agente conversacional (WhatsApp/Telegram).** Será mais um cliente da mesma API. Reservado no design: (a) API é a única porta de dados; (b) Better Auth com API keys / token de serviço com escopo por usuário; (c) conceito de vínculo de canal externo → `user_id` (ex.: tabela `external_links` mapeando `channel`, `external_id` → `user_id`). O modelo de linguagem (provavelmente Claude) e a plataforma do agente serão decididos na spec própria do agente.
- **AG-002:** Se o agente for construído em plataforma não-TS, expor um subconjunto REST via `trpc-openapi` apenas para o agente, sem alterar o tRPC do resto.
- **iOS:** o mobile entrega Android primeiro; iOS é build subsequente do mesmo código Expo.

---

## Success Criteria

- SC-001: A lógica de domínio (RN-*) vive em `packages/core` como funções puras; nenhum cálculo de negócio duplicado nos clientes ou na API.
- SC-002: Nenhum cliente (web/mobile) acessa o banco diretamente; toda leitura/escrita via procedures tRPC.
- SC-003: Paridade funcional: toda FR de domínio existe na web e no mobile.
- SC-004: Isolamento por `user_id` verificável: usuário A nunca acessa dados de B.
- SC-005: Build da API aborta se a flag de modo dev estiver ligada em produção.
- SC-006: CI (`ci.yml`) passa em lint, typecheck, testes e build. SonarCloud Quality Gate verde no PR.
- SC-007: `packages/core` tem testes de unidade cobrindo saldo, total/restante, "vence este mês" e regras de período.
- SC-008: Nenhum arquivo com mais de 300 linhas (RE-001); duplicação dentro do limite do Quality Gate (RE-003).
- SC-009: Fluxo manual end-to-end na web e no mobile: signup → login → criar categoria/subcategoria → criar transação receita e despesa → conferir cards e gráficos → criar cobrança/fatura/assinatura → conferir cards → mudar status → logout.

---

## Boundaries para o agente de implementação

- ✅ Sempre: respeitar RE-001 a RE-006; filtrar `user_id` em toda query de domínio; validar identidade em toda mutação; invalidar cache após mutação nos clientes; manter lógica de negócio em `packages/core`; rodar lint/typecheck/testes/build antes de reportar pronto; atualizar `docs/` ao concluir trabalho arquitetural.
- ⚠️ Perguntar antes: adicionar dependências fora do stack travado; mudar o schema de auth do adapter; alterar regras de negócio (RN-*); decidir identidade visual final.
- 🚫 Nunca: colocar segredos no bundle do cliente; pôr query de banco em cliente; acoplar lógica de negócio ao runtime do Next/Expo; commitar `.env`; remover guard de modo dev.

---

## Assumptions

- Não há usuários reais em produção hoje; banco começa limpo, sem migração de dados.
- Testes (Vitest) incluídos ao menos para `packages/core` e services de domínio.
- Identidade visual concreta (paleta, claro/escuro) definida na implementação via skill `frontend-design`, mantendo verde=entrada / vermelho=saída.
- O app é de uso pessoal/solo neste momento; arquitetura suporta multiusuário (isolamento por `user_id`) mas não há requisito de times/compartilhamento.

---

## Decomposição em sub-projetos (ordem sugerida de implementação)

Cada item vira sua própria spec → plano → execução. Esta spec é a fundação; os planos detalham cada fatia.

1. **Fundação do monorepo + API base:** monorepo, Drizzle/schema, Better Auth (signup/login/logout/reset), `packages/core` + `packages/schemas`, primeira procedure tRPC, CI + SonarCloud.
2. **Web:** Next.js consumindo a API, telas de auth, domínios (transações → categorias → cobranças → faturas → assinaturas → dashboard).
3. **Mobile:** Expo consumindo a API, auth por token, paridade dos domínios, requisitos de memória (ME-*).
4. **Polimento:** tema claro/escuro, responsividade, gráficos, edge cases.
5. **Backlog:** agente (AG-*), iOS.

> Recomendação: a próxima sessão escreve o plano de implementação do sub-projeto 1 (fundação), que destrava todos os demais.
