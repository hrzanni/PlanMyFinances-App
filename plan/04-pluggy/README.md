# Fase 4 — Integração Meu Pluggy (Conexões) · Mapa de tarefas

> Detalhe a nível de passos será escrito quando chegarmos. Spec: amendment 2026-07-06, seção 3 (FR-120..125).

**Goal:** sincronizar transações das contas do próprio usuário via Open Finance (Meu Pluggy, gratuito), com tela "Conexões" na web e no mobile.

**Depende de:** Fases 2 e 3 (telas e routers de domínio prontos). Schema (`bank_connections`, `transactions.source/external_id`) já existe desde a fase 1.

**Dependência do usuário:** conta em [meu.pluggy.ai](https://meu.pluggy.ai) com bancos conectados + `PLUGGY_CLIENT_ID`/`PLUGGY_CLIENT_SECRET` no `.env` da API.

**Princípio:** nenhum cliente fala com a Pluggy; só a API (FR-124). Sync idempotente por dedup de `external_id` (SC-102). Falha de sync nunca corrompe dados (FR-123).

| # | Subtarefa | Objetivo / entregável | Refs |
|---|---|---|---|
| 4.1 | Client Pluggy na API | módulo `apps/api/src/pluggy/` — auth (client_id/secret → apiKey), listar items/accounts, buscar transações por período | FR-124 |
| 4.2 | Service de sync | dedup por (`user_id`,`external_id`), grava `source='pluggy'` com `category_id` NULL, atualiza `last_synced_at`/status; erros viram status `error`/`expired` | FR-121/123, SC-102 |
| 4.3 | Router `connections` | procedures list / register (vincula `pluggy_item_id`) / sync / remove | FR-120 |
| 4.4 | Tela Conexões (web) | lista de conexões (instituição, status, última sync, consentimento), botão "Sincronizar agora", contagem "a revisar" com atalho | FR-120/122 |
| 4.5 | Tela Conexões (mobile) | paridade da 4.4 no stack "Mais" | FR-120/122 |
| 4.6 | Revisão de importadas | filtro "a revisar" (source=pluggy, sem categoria) no Histórico das duas plataformas | FR-122/125 |

**Definition of Done da fase:** duas syncs seguidas não duplicam nada (SC-102); transações importadas aparecem com badge da instituição e entram nos cálculos; falha de credencial vira estado visível sem corromper dados; app segue 100% funcional sem Pluggy configurado.
