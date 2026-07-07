# Spec de Rebuild — PlanMyFinances

> Documento de especificação para construir o PlanMyFinances do zero.
> Idioma: UI/docs/commits em PT-BR; código (variáveis, funções, arquivos, tabelas) em EN.
> Convenções RFC 2119: MUST (obrigatório), SHOULD (recomendado), MAY (opcional).

---

## Regras de Engenharia (invioláveis no rebuild)

- RE-001: **Máximo de 300 linhas de código por arquivo.** Arquivo que ultrapassar MUST ser quebrado em módulos menores (componentes, hooks, helpers, services) - Deve haver uma skill no arquivo `.claude/skills/` para isso e outras regras.
- RE-002: **Modularização.** Cada responsabilidade em seu próprio arquivo/módulo: leitura (service), mutação (action), tipos (types), UI (componente). Nada de "arquivo faz-tudo".
- RE-003: **Evitar código duplicado (DRY).** Lógica repetida (formatação de moeda/data, cálculos de total/restante/saldo, estilos de input/modal, queries por `user_id`) MUST ser extraída para helper/componente/service único e reutilizada. Sem copy-paste de estilos inline nem de cálculos entre páginas.
- RE-004: Componentes de UI reutilizáveis (Button, Input, Select, Card, Dialog, Table, Tabs, Badge) vivem em um único lugar (`packages/ui` ou `apps/web/components/ui`) e são consumidos por todas as telas.
- RE-005: Funções utilitárias compartilhadas (formatCurrency, formatDate, cálculo de período do mês) vivem em um módulo de utils único, importado onde preciso.

## Modelo de dados (Drizzle / Postgres)

Todas as tabelas de domínio MUST ter `user_id` (FK → `users.id`). Datas `date`/`due_date` armazenadas como tipo `date` do Postgres. Valores monetários como `numeric(12,2)`. IDs como `uuid` (default `gen_random_uuid()`). `created_at` como `timestamptz default now()`.

### users (Auth.js)

Schema padrão do adapter Drizzle do Auth.js (`users`, `accounts`, `sessions`, `verification_tokens`) + coluna `password_hash` (text, nullable) para o provider Credentials.

### categories

`id`, `user_id` (FK users), `name` (text, NOT NULL), `type` (`'receita' | 'despesa'`, NOT NULL).

### subcategories

`id`, **`user_id` (FK users, NOT NULL)** ← _corrige débito (antes não existia)_, `category_id` (FK categories, NOT NULL), `name` (text, NOT NULL).

### transactions

`id`, `user_id` (FK users), `type` (`'receita' | 'despesa'`), `value` (numeric(12,2), NOT NULL, > 0), `description` (text, nullable), `category_id` (FK categories, nullable), `subcategory_id` (FK subcategories, nullable), `date` (date, NOT NULL), `created_at`.

### charges (cobranças — valores a receber)

`id`, `user_id`, `debtor_name` (text, NOT NULL), `description` (text, nullable), `amount_per_installment` (numeric(12,2), NOT NULL, > 0), `total_installments` (int, NOT NULL, >= 1), `amount_paid` (numeric(12,2), NOT NULL, default 0, >= 0), `due_date` (date, nullable), `status` (`'pendente' | 'cobrado' | 'pago'`, default `'pendente'`), `created_at`.
**CHECK**: `amount_paid <= amount_per_installment * total_installments` ← _corrige débito_.

### faturas (cartões/contas parceladas — valores a pagar)

`id`, `user_id`, `card_name` (text, NOT NULL), `description` (text, nullable), `amount_per_installment` (numeric(12,2), NOT NULL, > 0), `total_installments` (int, NOT NULL, >= 1), `amount_paid` (numeric(12,2), NOT NULL, default 0, >= 0), `due_date` (date, nullable), `status` (`'pendente' | 'pago'`, default `'pendente'`), `created_at`.
**CHECK**: `amount_paid <= amount_per_installment * total_installments` ← _corrige débito_.

### assinaturas (recorrências mensais)

`id`, `user_id`, `name` (text, NOT NULL), `amount` (numeric(12,2), NOT NULL, > 0), `due_day` (int, nullable, 1–31, apenas informativo), `status` (`'ativo' | 'cancelado'`, default `'ativo'`), `created_at`.

### Relações e deleção

- `subcategories.category_id` → `categories.id`: **ON DELETE CASCADE** (apaga subcategorias da categoria removida).
- `transactions.category_id` / `transactions.subcategory_id`: **ON DELETE SET NULL** (transações sobrevivem; viram "sem categoria"). ← _corrige débito de órfãos_.
- Demais FKs de domínio → `users.id`: **ON DELETE CASCADE**.

> Nota: tabelas `faturas` e `assinaturas` permanecem nomeadas em PT (já estavam em PT no schema original; manter para consistência de domínio). Colunas em EN.

---

## Domínios e Funcionalidades

### Transações (`/`, `/historico`, `/dashboard`)

- FR-001: O sistema MUST permitir criar, editar e excluir transações do tipo `receita` ou `despesa`, com `value`, `date` (default hoje), `description` opcional, `category_id` opcional e `subcategory_id` opcional.
- FR-002: O formulário de transação MUST filtrar as categorias pela `type` selecionada (receita mostra só categorias de receita; despesa idem) e MUST carregar subcategorias da categoria escolhida.
- FR-003: A Home (`/`) MUST exibir as 5 transações mais recentes (ordem `date DESC, created_at DESC`), 3 cards do mês corrente (receitas, despesas, saldo) e um gráfico de barras receitas × despesas do mês.
- FR-004: O Histórico (`/historico`) MUST listar todas as transações com filtros independentes e cumulativos: `type`, `category_id`, `subcategory_id`, `date_from`, `date_to`, e MUST permitir excluir transações da lista.
- FR-005: Os filtros do Histórico MUST persistir na URL (query params), sobrevivendo a reload e compartilhamento de link ← _corrige débito_.
- FR-006: O Dashboard (`/dashboard`) MUST ter seletor de mês (input month), 3 cards (receitas, despesas, saldo) do mês selecionado, gráfico de barras receitas × despesas e gráfico de linha do saldo acumulado por dia no mês.

### Categorias e Subcategorias (`/categorias`)

- FR-010: O sistema MUST permitir CRUD de categorias (`name`, `type`) e de subcategorias (`name`, vinculadas a uma categoria).
- FR-011: Excluir uma categoria MUST apagar suas subcategorias (cascade) e MUST setar `category_id`/`subcategory_id` das transações afetadas para NULL (não excluir transações).
- FR-012: Subcategorias MUST pertencer ao usuário (coluna `user_id`) e ser isoladas por usuário diretamente, sem depender de filtro indireto por categoria.

### Cobranças (`/cobrancas` — a receber)

- FR-020: O sistema MUST permitir CRUD de cobranças com `debtor_name`, `description?`, `amount_per_installment`, `total_installments`, `due_date?`, `amount_paid` (default 0) e `status` (`pendente`/`cobrado`/`pago`).
- FR-021: O sistema MUST calcular `total = amount_per_installment * total_installments` e `restante = total - amount_paid`.
- FR-022: O sistema MUST exibir 3 cards: "A receber" = soma de `restante` onde `status ≠ pago`; "Vence este mês" = soma de `restante` onde `status ≠ pago` e `due_date` no mês/ano corrente; "Total recebido" = soma de `amount_paid`.
- FR-023: O usuário MUST poder mudar o status inline na tabela (transições livres entre estados).
- FR-024: O sistema MUST rejeitar `amount_paid > total` (validação no form e CHECK no banco) ← _corrige débito_.

### Faturas (`/faturas`, aba "Faturas" — a pagar)

- FR-030: O sistema MUST permitir CRUD de faturas com `card_name`, `description?`, `amount_per_installment`, `total_installments`, `due_date?`, `amount_paid` (default 0) e `status` (`pendente`/`pago`).
- FR-031: Cálculos e cards análogos às cobranças ("Em aberto" = restante onde `status = pendente`; "Vence este mês"; "Total pago").
- FR-032: Mesma validação `amount_paid <= total` ← _corrige débito_.

### Assinaturas (`/faturas`, aba "Assinaturas")

- FR-040: O sistema MUST permitir CRUD de assinaturas com `name`, `amount` (mensal), `due_day?` (1–31, informativo) e `status` (`ativo`/`cancelado`).
- FR-041: O sistema MUST exibir o total mensal = soma de `amount` onde `status = ativo`. Assinatura é catálogo informativo; NÃO gera transações automáticas (comportamento atual mantido).

### Navegação / Layout

- FR-050: O app autenticado MUST ter sidebar com: Início, Histórico, Dashboard, Categorias, grupo "Contas" (Cobranças, Faturas) e botão Sair.

---

## Auth & Permissões (Auth.js v5)

- FR-060: O sistema MUST suportar signup (email/senha), login, logout e recuperação de senha.
- FR-061: Senhas MUST ser armazenadas com hash bcrypt em `users.password_hash`; nunca em texto puro.
- FR-062: Recuperação de senha MUST usar token em `verification_tokens`, enviado por email via Resend. `/reset-password` valida o token, grava a nova senha e invalida o token.
- FR-063: O `proxy.ts` MUST proteger todas as rotas autenticadas e liberar como públicas: `/login`, `/signup`, `/forgot-password`, `/reset-password` e as rotas de API do Auth.js (`/api/auth/*`).
- FR-064: Usuário autenticado que acessa rota de auth MUST ser redirecionado para `/`.

### Isolamento de dados (defense-in-depth)

- FR-070: Toda leitura/escrita em tabela de domínio MUST filtrar por `user_id` do usuário da sessão, dentro da camada de services. Nenhum dado de um usuário pode vazar para outro.
- FR-071: Toda Server Action de mutação MUST validar a sessão (`auth()`); sem sessão → erro de não autorizado.
- AC: Dado o usuário A logado, quando ele consulta/edita um registro do usuário B (por id), então o sistema retorna vazio/erro e nunca os dados de B.

### Modo DEV ("Entrar como Admin")

- FR-080: Em desenvolvimento local, o sistema MUST oferecer bypass de auth via `AUTH_BYPASS=true`, injetando um usuário dev fixo (`DEV_USER_ID = 00000000-0000-0000-0000-000000000001`, `email = dev@local`) provisionado pelo seed.
- FR-081: O bypass MUST ser impossível em produção. MUST haver guards equivalentes aos 4 atuais:
  1. Runtime: helper retorna `false` se `NODE_ENV = production`.
  2. Proxy: bloqueia (403) se modo dev ligado e hostname não-local (`localhost`, `127.0.0.1`, `0.0.0.0`, `::1`).
  3. Server (action/route de login dev): revalida host local.
  4. Build (`next.config.ts`): aborta o build se `NODE_ENV = production` e flag dev ligada.
- FR-082: Botão "Entrar como Admin" MUST aparecer só em localhost, abaixo do form de login. Badge "DEV MODE" MUST aparecer no topo quando o modo está ativo. Eventos dev logados com prefixo `[DEV MODE]`.

---

## Regras de Negócio (consolidadas)

- RN-001: Saldo do mês = `SUM(receitas) - SUM(despesas)` para transações em `[primeiro_dia_mes, ultimo_dia_mes]`. Cálculo no servidor (Server Component/service), não mais no cliente.
- RN-002: "Mês corrente" baseado na data do servidor.
- RN-003: Cobrança/fatura `total = amount_per_installment * total_installments`; `restante = total - amount_paid`.
- RN-004: `amount_paid` MUST estar em `[0, total]` (validação form + CHECK banco).
- RN-005: "Vence este mês" considera só registros com `status ≠ pago` (cobrança) / `status = pendente` (fatura) e `due_date` no mês/ano corrente; sem `due_date` não entra.
- RN-006: Transições de status são livres (sem máquina de estados); cobranças: pendente/cobrado/pago; faturas: pendente/pago; assinaturas: ativo/cancelado.
- RN-007: Categoria tem `type`; subcategoria herda da categoria pai (sem `type` próprio).
- RN-008: `due_date` e `date` podem estar no passado (estado "vencido"/lançamento retroativo é legítimo); MUST ser data válida.
- RN-009: Assinatura não gera transação automática; total mensal ativo = soma de `amount` onde `status = ativo`.

---

## UI / Design

- FR-090: A UI MUST ser reconstruída com shadcn/ui sobre Tailwind 4, usando a skill `frontend-design` para qualidade visual (evitar aparência genérica de IA).
- FR-091: MUST existir um conjunto de componentes reutilizáveis cobrindo: Button, Input, Select, Card, Dialog/Modal, Table, Tabs, Badge. Formulários NÃO podem duplicar estilos inline (mata o débito de `inputStyle` repetido).
- FR-092: Formulários abrem como Dialog (modal) reutilizável, não como `position: fixed` ad-hoc por componente.
- FR-093: Valores monetários formatados em `pt-BR`/BRL; datas exibidas como DD/MM/YYYY.
- FR-094: A UI MUST ser responsiva (desktop e mobile).
- SHOULD: definir tokens de tema (cores, spacing, radius) e suportar tema claro/escuro consistente. (Identidade visual fica a cargo da skill `frontend-design`; manter legibilidade financeira: verde para entradas, vermelho para saídas.)

---

## Páginas / Rotas

| Rota                                                       | Tipo      | Conteúdo                                                      |
| ---------------------------------------------------------- | --------- | ------------------------------------------------------------- |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | público   | fluxos de auth                                                |
| `/` (home)                                                 | protegido | 5 últimas transações, 3 cards do mês, barra receitas×despesas |
| `/historico`                                               | protegido | lista + filtros (persistidos na URL) + excluir                |
| `/dashboard`                                               | protegido | seletor de mês, cards, barra, linha de saldo acumulado        |
| `/categorias`                                              | protegido | CRUD categorias/subcategorias                                 |
| `/cobrancas`                                               | protegido | cards + tabela + form (modal)                                 |
| `/faturas`                                                 | protegido | abas Faturas/Assinaturas, cards + tabelas + forms             |
| `/api/auth/*`                                              | público   | handlers Auth.js                                              |

---

## Error Handling

| Falha                            | Comportamento ao usuário                                     | Notas                       |
| -------------------------------- | ------------------------------------------------------------ | --------------------------- |
| Login inválido                   | Mensagem "Email ou senha inválidos"                          | sem revelar qual campo      |
| Sessão ausente em rota protegida | Redirect para `/login`                                       | via `proxy.ts`              |
| Server Action sem sessão         | Erro "Não autorizado"                                        | nunca executa mutação       |
| `amount_paid > total`            | Erro de validação no form, submit bloqueado                  | + CHECK no banco como rede  |
| Falha de query/DB                | Mensagem genérica "Erro ao carregar/salvar", log no servidor | sem expor detalhes internos |
| Token de reset inválido/expirado | "Link inválido ou expirado, solicite novo"                   | token consumido após uso    |
| Dev bypass fora de localhost     | 403                                                          | guard no proxy/server       |

---

## Edge Cases

- Mês sem transações: cards zerados, gráficos vazios sem quebrar.
- Transação com categoria depois excluída: aparece como "sem categoria" (category_id NULL), nunca quebra.
- Cobrança/fatura sem `due_date`: não entra em "vence este mês".
- `total_installments = 1`: tratado como parcela única.
- Filtros de histórico combinados sem resultado: lista vazia com estado claro.
- Concorrência: edição/optimistic update na tabela MUST revalidar via `revalidatePath` após a Server Action (sem ficar dessincronizado como hoje).
- Usuário tentando acessar registro de outro usuário por id manipulado: bloqueado pelo filtro `user_id`.

---

## Constraints

- Tech: Next.js 16 (App Router) + React 19 + TS 5; Tailwind 4 + shadcn/ui; Drizzle + Neon Postgres; Auth.js v5 (versão beta **pinada exata**); Recharts; Resend.
- Convenção: middleware é `apps/web/proxy.ts` / função `proxy`.
- Idioma: UI/commits/docs PT-BR; código/tabelas EN (exceto `faturas`/`assinaturas`).
- Segurança: nenhum segredo no bundle do cliente (credenciais dev e service keys são server-only, sem `NEXT_PUBLIC_`); senhas com bcrypt; filtro `user_id` obrigatório.
- Sem queries de banco em Client Components.

---

## Success Criteria

- SC-001: `grep -r supabase apps/ packages/ modules/` retorna vazio (zero acoplamento a Supabase).
- SC-002: Nenhum Client Component chama o banco diretamente; toda leitura via Server Component/service, toda mutação via Server Action.
- SC-003: Build de produção falha se a flag de modo dev estiver ligada.
- SC-004: Todas as FRs verificáveis por um fluxo end-to-end manual (signup → criar dados em cada domínio → ver cards/gráficos corretos → logout).
- SC-005: Zero duplicação de estilos de input/modal (componentes shadcn reutilizados).
- SC-006 (testes): cada service de domínio tem testes de unidade cobrindo cálculos (saldo, total/restante, "vence este mês") e isolamento por `user_id`. _(ver Assumptions)_

---

## Boundaries para o agente de implementação

- ✅ Sempre: respeitar as Regras de Engenharia (RE-001 a RE-005 — máx. 300 linhas/arquivo, modularizar, DRY); filtrar `user_id` em toda query de domínio; validar sessão em toda Server Action; `revalidatePath` após mutações; atualizar `docs/` e `docs/changelog.md` (data ISO) ao concluir trabalho arquitetural; rodar `npm run lint` e `npm run build` antes de reportar pronto.
- ⚠️ Perguntar antes: adicionar dependências fora do stack fixado; mudar o schema de auth do adapter; alterar regras de negócio (RN-\*); decidir identidade visual final.
- 🚫 Nunca: reintroduzir Supabase; colocar segredos no cliente; remover qualquer um dos 4 guards do modo dev; pôr query de banco em Client Component; commitar `.env`.

---

## Assumptions

- Não há usuários reais em produção hoje, então o rebuild pode descartar os dados/infra Supabase atuais (não há migração de dados de usuários). **Confirmar.**
- O rebuild inclui testes (Vitest) ao menos para os services (cálculos + isolamento). Se o usuário não quiser testes agora, remover SC-006.
- Identidade visual concreta (paleta, claro/escuro) será definida pela skill `frontend-design` durante a implementação, mantendo verde=entrada / vermelho=saída.
- `faturas` e `assinaturas` permanecem nomeadas em PT no schema (consistência com o domínio atual).

---

## Out-of-band questions (o agente deve perguntar se ficar em dúvida)

- Migrar dados existentes ou começar com banco limpo? (assumido: limpo)
- Incluir testes neste rebuild? (assumido: sim, nos services)
- Manter exatamente os mesmos 4 guards de dev mode adaptados ao Auth.js? (assumido: sim)

---

## Entrega deste plano (única ação na aprovação)

Esta é uma **spec/plano escrito**, não implementação. Na aprovação, a **única** ação é salvar este documento como arquivo `.md` dentro do projeto, em `docs/rebuild-spec.md`, para servir de fonte de verdade do rebuild. **Nenhuma mudança de código será feita.** A reconstrução em si só começa depois, em sessão separada, quando você pedir.

## Verificação do rebuild (referência futura, não agora)

1. `npm run build` e `npm run lint` na raiz passam.
2. Fluxo manual: signup → login → criar categoria/subcategoria → criar transação receita e despesa → conferir cards e gráficos na home e no dashboard → criar cobrança/fatura/assinatura → conferir cards → mudar status → recarregar (filtros do histórico persistem na URL) → logout.
3. `grep -r supabase apps/ packages/ modules/` vazio.
4. Tentar build com flag dev ligada em `NODE_ENV=production` → falha esperada.
5. Testes dos services (saldo, total/restante, vence-este-mês, isolamento user_id) passam.
6. Nenhum arquivo com mais de 300 linhas (RE-001); sem duplicação de cálculos/estilos (RE-003).
