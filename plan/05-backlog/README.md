# Fase 5 — Backlog · Mapa de tarefas

> Itens conscientemente adiados. Cada um vira sua própria spec → plano quando priorizado. Os ganchos arquiteturais já existem desde a fundação.

**Depende de:** produto base funcionando (Fases 1–3).

| # | Subtarefa | Objetivo / entregável | Ganchos já reservados |
|---|---|---|---|
| 5.1 | Agente conversacional (AG-001) | bot WhatsApp/Telegram que consome dados via linguagem natural | API como única porta; Better Auth com API keys/token de serviço; conceito de vínculo canal→usuário |
| 5.2 | Superfície REST opcional (AG-002) | expor subconjunto REST via `trpc-openapi` só para o agente | só se a plataforma do agente não for TS |
| 5.3 | iOS | build iOS do mesmo código Expo + ajustes de plataforma + publicação | Expo já é multiplataforma |

## Notas de design do agente (5.1), para a spec futura

- **Identidade:** o bot não loga com senha. Precisa de token de serviço com escopo por usuário (plugin de API keys do Better Auth) e de uma tabela `external_links` (`channel`, `external_id`, `user_id`, `created_at`) mapeando o número/chat ao usuário. O usuário conecta o canal uma vez (fluxo de linking).
- **Acesso a dados:** o agente chama as mesmas procedures tRPC dos clientes; herda isolamento por `user_id` e regras de negócio sem reimplementar nada.
- **Modelo de linguagem:** provavelmente Claude (decisão e versão na spec do agente; consultar o estado da arte na época).
- **Plataforma primeiro:** WhatsApp ou Telegram (decidir na spec própria; Telegram costuma ser mais simples de prototipar).

## Notas de design do iOS (5.3)

- Mesmo código Expo; o trabalho é ajuste de plataforma (permissões, ícones, splash), conta Apple Developer e publicação. Sem reescrita.

**Definition of Done (por item):** cada item só é considerado quando tiver sua própria spec aprovada e plano detalhado, fora deste mapa.
