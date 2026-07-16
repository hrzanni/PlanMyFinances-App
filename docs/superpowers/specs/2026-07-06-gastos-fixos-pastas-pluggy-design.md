# Spec Amendment — Gastos Fixos, Pastas, Conexões (Meu Pluggy), Tela do Agente e Tema Nexforce

> Emenda à spec base `2026-06-25-planmyfinances-multiplatform-design.md`. Tudo que não é alterado aqui permanece válido.
> Protótipo visual aprovado: `docs/mockups/planmyfinances-telas.html` (aprovado em 2026-07-06).
> Convenções RFC 2119. Data: 2026-07-06.

---

## Resumo das mudanças

| Mudança | Substitui / adiciona |
|---|---|
| **Gastos Fixos** (`fixed_expenses` + `fixed_expense_payments`) | Substitui Assinaturas (`subscriptions`, FR-040/041, RN-009) |
| **Pastas** (`folders`) | Novo domínio: agrupamento de transações |
| **Conexões** (`bank_connections`, Meu Pluggy) | Novo domínio: sincronização Open Finance |
| **Tela do Agente** (estática, "Em breve") | Antecipa a UI do AG-001; sem backend |
| **Tema Nexforce** | Define a identidade visual concreta (era assumption da spec base) |
| `transactions.folder_id`, `transactions.source`, `transactions.external_id` | Colunas novas |

---

## 1. Gastos Fixos

Despesas mensais recorrentes (aluguel, condomínio, IPTU, streaming) com dia de vencimento e controle de pagamento **por mês**.

### Modelo de dados

**`fixed_expenses`**
`id` uuid, `user_id` (FK users, CASCADE), `name` text NOT NULL, `amount` numeric(12,2) NOT NULL > 0 (valor vigente), `due_day` int NOT NULL 1–31, `category_id` (FK categories, nullable, SET NULL), `status` (`'active' | 'archived'`, default `'active'`), `created_at`.

**`fixed_expense_payments`**
`id` uuid, `user_id` (FK users, CASCADE), `fixed_expense_id` (FK fixed_expenses, CASCADE), `reference_month` date NOT NULL (sempre dia 1 do mês), `amount` numeric(12,2) NOT NULL (snapshot do valor na época do pagamento), `paid_at` date NOT NULL, `transaction_id` (FK transactions, nullable, SET NULL), `created_at`.
**UNIQUE** (`fixed_expense_id`, `reference_month`).

### Requisitos funcionais

- FR-100: CRUD de gastos fixos (`name`, `amount`, `due_day`, `category_id?`). Arquivar em vez de excluir quando houver pagamentos históricos; exclusão definitiva MUST pedir confirmação e manter transações criadas (via SET NULL no vínculo).
- FR-101: A tela MUST ter seletor de mês. Para o mês selecionado, cada gasto ativo aparece com status derivado: **pago** (existe payment do mês), **pendente** (sem payment, vencimento futuro no mês) ou **vencido** (sem payment e `due_day` já passou no mês corrente).
- FR-102: 3 cards do mês: Total mensal (soma `amount` dos ativos), Pago (soma dos `payments.amount` do mês), Pendente (Total − Pago, considerando snapshot para pagos).
- FR-103: **Marcar como pago** MUST criar `fixed_expense_payments` (com snapshot de `amount` vigente) e criar automaticamente uma transação `despesa` no mês (valor do snapshot, categoria do gasto, `source = 'fixed_expense'`), vinculada via `transaction_id`.
- FR-104: **Desmarcar** MUST remover o payment e a transação vinculada juntos, na mesma operação. Nada fica órfão.
- FR-105: **Editar `amount` vale só do mês vigente em diante.** Pagamentos existentes preservam o snapshot; meses passados exibem o valor pago na época. O histórico NUNCA é reescrito.
- FR-106: Na virada do mês não há job nem ação automática: o status é derivado por consulta (ausência de payment no mês = pendente). Meses anteriores permanecem navegáveis no seletor.
- FR-107: A Home MUST exibir widget "Gastos fixos do mês": X de N pagos, total pendente e próximo vencimento.

### Regras de negócio (packages/core, funções puras)

- RN-100: `status(gasto, mês, hoje, payments)` → pago | pendente | vencido, conforme FR-101.
- RN-101: Totais do mês conforme FR-102 (pago usa snapshot; pendente usa `amount` vigente).
- RN-102: `reference_month` normaliza qualquer data para o dia 1 do mês.

> Remove-se: FR-040, FR-041, RN-009 e a tabela `subscriptions` da spec base.

---

## 2. Pastas

Agrupamento livre de transações por objetivo (viagem, reforma, evento) para conhecer o custo total.

### Modelo de dados

**`folders`**
`id` uuid, `user_id` (FK users, CASCADE), `name` text NOT NULL, `icon` text nullable (emoji), `status` (`'active' | 'archived'`, default `'active'`), `created_at`.

**`transactions.folder_id`**: FK folders, nullable, **ON DELETE SET NULL**.

### Requisitos funcionais

- FR-110: CRUD de pastas (`name`, `icon?`, `status`). Excluir pasta MUST manter as transações (folder_id → NULL).
- FR-111: O formulário de transação MUST oferecer campo opcional "Pasta".
- FR-112: A tela de Pastas MUST exibir um card por pasta com: nome, status, **total gasto** (soma das despesas associadas), contagem de transações e **as transações dentro do próprio card** (expansível; recolhido mostra só o total). Sem conceito de orçamento.
- FR-113: No Histórico, transação com pasta MUST exibir badge com o nome da pasta.
- RN-110: Total da pasta = SUM(value) das transações `despesa` com `folder_id` da pasta (função pura em core).

---

## 3. Conexões — Open Finance via Meu Pluggy

Sincronização somente-leitura das contas do próprio usuário, usando as credenciais de desenvolvimento gratuitas do Meu Pluggy (meu.pluggy.ai). Racional: participação direta no Open Finance exige instituição regulada; agregadores pagos custam R$ 2.500+/mês; o Meu Pluggy cobre o caso de uso pessoal gratuitamente.

### Modelo de dados

**`bank_connections`**
`id` uuid, `user_id` (FK users, CASCADE), `pluggy_item_id` text NOT NULL, `institution_name` text NOT NULL, `status` (`'connected' | 'error' | 'expired'`, default `'connected'`), `last_synced_at` timestamptz nullable, `consent_expires_at` date nullable, `created_at`.

**`transactions.source`**: (`'manual' | 'fixed_expense' | 'pluggy'`, NOT NULL, default `'manual'`).
**`transactions.external_id`**: text nullable; **UNIQUE parcial** (`user_id`, `external_id`) WHERE `external_id IS NOT NULL` — dedup de importação.

### Requisitos funcionais

- FR-120: A tela Conexões MUST listar conexões com instituição, status, última sincronização e validade do consentimento, e oferecer "Sincronizar agora".
- FR-121: A sincronização MUST buscar transações novas via Pluggy Data API, deduplicar por `external_id` e gravar como `source = 'pluggy'` com `category_id` NULL.
- FR-122: Transações importadas sem categoria contam como "a revisar"; a UI MUST destacar a contagem e oferecer atalho para categorizá-las.
- FR-123: Falha de sync MUST virar estado visível na conexão (`error`/`expired`) sem corromper dados; nova tentativa é sempre segura (idempotente por dedup).
- FR-124: Credenciais Pluggy (`PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET`) vivem só no ambiente da API. Nenhum cliente fala com a Pluggy diretamente.
- FR-125: Histórico e Home MUST exibir badge de origem nas transações (`manual` sem badge ou neutro; `gasto fixo`; nome da instituição para Pluggy).

### Limitações aceitas

- Cobre apenas as contas do dono das credenciais (app de uso pessoal — assumption da spec base).
- Sem SLA; se o Meu Pluggy indisponibilizar, o app segue 100% funcional em modo manual.

---

## 4. Tela do Agente (sem funcionalidade)

- FR-130: Web e mobile MUST exibir a entrada "Agente" na navegação com selo "Em breve".
- FR-131: A tela MUST mostrar a UI de chat estática (conversa de exemplo esmaecida + input desabilitado), sem chamadas de rede. Serve de âncora visual para o AG-001 do backlog.

---

## 5. Categorias — apresentação

- FR-140: A tela de Categorias MUST separar visualmente duas seções: **Despesas** e **Receitas** (sem misturar tipos na mesma lista). CRUD inalterado (FR-010..012).

---

## 6. Identidade visual — Tema Nexforce

Resolve a assumption "identidade visual definida na implementação" da spec base.

- FR-150: Tokens de tema (cores, spacing, radius) compartilhados conceitualmente entre web (CSS variables/Tailwind) e mobile (NativeWind), com **claro e escuro** e detecção do sistema + toggle.
- Paleta (claro): fundo `#F5F5F5`, superfície `#FFFFFF`, texto `#0C0E0E`, corpo `#515151`, secundário `#777777`, bordas `#E4E4E2`, sidebar `#0C0E0E`, navy `#303F63` (gráficos informativos/linha de saldo), azul `#215A9F` (links/informativo), verde `#2D6E44` (receitas/pago), vermelho `#BA1925` (despesas/vencido), amarelo `#D8B523` (atenção — nunca como texto sobre fundo claro).
- Paleta (escuro): fundo `#0C0E0E`, superfície `#161919`, bordas `#292D2D`, texto `#FFFFFF`, corpo `#C7C7C5`; semânticas clareadas para contraste AA: verde `#5CBF8B`, vermelho `#F0707A`, navy `#8FA3D1`, azul `#7FB0E8`.
- Regra de uso (da marca): interface predominantemente preto/branco/cinza; verde/vermelho/amarelo **somente** em valores e status, nunca decorativos. Fonte **Lato** (Google Fonts na web; expo-google-fonts no mobile).
- FR-151: Navegação web: sidebar escura com grupos — principal (Início, Histórico, Categorias, Pastas), "Contas" (Gastos Fixos, Cobranças, Faturas), "Automação" (Conexões, Agente), Sair. Mobile: 5 tabs (Início, Histórico, Fixos, Faturas, Mais) com stack "Mais" (Pastas, Categorias, Cobranças, Conexões, Agente, Sair). *(Dashboard/Dash removidos em 2026-07-10 — fundidos com Início, ver `2026-07-10-fusao-inicio-dashboard-design.md`. Faturas promovida de item do stack "Mais" para tab própria em 2026-07-16.)*

---

## Error handling adicional

| Falha | Comportamento |
|---|---|
| Marcar pago duas vezes no mesmo mês | Bloqueado pela UNIQUE (`fixed_expense_id`,`reference_month`); UI trata como no-op |
| Excluir transação criada por gasto fixo direto no Histórico | Permitido; payment mantém snapshot com `transaction_id` NULL (histórico de pagamento preservado) |
| Sync Pluggy com credencial inválida/expirada | Conexão marcada `error`/`expired`, mensagem clara, dados intactos |
| Editar valor de gasto fixo já pago no mês | Payment do mês mantém o snapshot; novo valor só afeta meses sem pagamento |

## Edge cases adicionais

- Gasto fixo com `due_day` 31 em mês de 30 dias (ou fevereiro): vencimento efetivo = último dia do mês (função pura em core).
- Pasta arquivada continua exibindo total e transações; apenas some do formulário de novas transações.
- Mês futuro no seletor de gastos fixos: tudo pendente, nada vencido.
- Importação Pluggy de transação já registrada manualmente: não há dedup automático entre manual×pluggy (aceito nesta versão; usuário exclui a duplicata).

## Success criteria adicionais

- SC-100: Fluxo gasto fixo ponta a ponta: criar → marcar pago → transação aparece no Histórico/saldo → editar valor → mês anterior intacto → desmarcar → transação some.
- SC-101: Fluxo pasta: criar → associar transações → total correto no card → excluir pasta → transações intactas sem pasta.
- SC-102: Sync Pluggy idempotente: duas syncs seguidas não duplicam transações.
- SC-103: Ambos os temas passam contraste AA nos textos e valores.
