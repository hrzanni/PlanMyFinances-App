# Fase 6 — Backlog · Mapa de tarefas

> Itens conscientemente adiados. Cada um vira sua própria spec → plano quando priorizado. Os ganchos arquiteturais já existem desde a fundação.

**Depende de:** produto base funcionando (Fases 1–4).

| # | Subtarefa | Objetivo / entregável | Ganchos já reservados |
|---|---|---|---|
| 6.1 | Agente conversacional (AG-001) | bot WhatsApp/Telegram que consome dados via linguagem natural | API como única porta; Better Auth com API keys/token de serviço; vínculo canal→usuário; **tela do agente já existe** (FR-130/131) |
| 6.2 | Superfície REST opcional (AG-002) | expor subconjunto REST via `trpc-openapi` só para o agente | só se a plataforma do agente não for TS |
| 6.3 | iOS | build iOS do mesmo código Expo + ajustes de plataforma + publicação | Expo já é multiplataforma |
| 6.4 | Open Finance pago (multiusuário) | trocar credenciais Meu Pluggy por plano pago da Pluggy se o app virar produto | camada de sync da fase 4 é reaproveitada intacta |
| 6.5 | Analytics de produto | instrumentar web + mobile com eventos de uso (telas, funil de cadastro, retenção) | nenhum; escolher ferramenta na spec (ver notas) |
| 6.6 | Cadastro e perfil ricos | coletar mais dados no cadastro/perfil (data de nascimento, gênero, …) e endurecer critérios de senha | tabela `users` extensível via migration; validação Zod em `packages/schemas` vale para web e mobile |
| 6.7 | Safe area no header mobile | título da tela (ex.: "Faturas") colado na barra de status do Android; respeitar a safe area | `react-native-safe-area-context` já vem com o Expo |
| 6.8 | Ícone do app + favicon | ícone no APK (hoje é o padrão Expo) e favicon na guia do navegador (hoje é o padrão) | mobile: `android.adaptiveIcon.foregroundImage` no `app.json` (PNG 1024×1024) + novo build EAS; web: `apps/web/src/app/icon.svg` (Next.js gera o favicon sozinho). Depende de ter o logo; um monograma provisório resolve até existir identidade visual |

## Notas de design do agente (6.1), para a spec futura

- **Identidade:** o bot não loga com senha. Precisa de token de serviço com escopo por usuário (plugin de API keys do Better Auth) e de uma tabela `external_links` (`channel`, `external_id`, `user_id`, `created_at`) mapeando o número/chat ao usuário. O usuário conecta o canal uma vez (fluxo de linking).
- **Acesso a dados:** o agente chama as mesmas procedures tRPC dos clientes; herda isolamento por `user_id` e regras de negócio sem reimplementar nada.
- **Modelo de linguagem:** provavelmente Claude (decisão e versão na spec do agente; consultar o estado da arte na época).
- **Plataforma primeiro:** WhatsApp ou Telegram (decidir na spec própria; Telegram costuma ser mais simples de prototipar).

## Notas de analytics (6.5), para a spec futura

- **Recomendação: PostHog** em vez de Mixpanel. Free tier do PostHog: 1M eventos/mês, SDK web e React Native no mesmo produto, session replay e feature flags inclusos, dados exportáveis. O Mixpanel também dá 1M eventos/mês grátis, mas separa replay/flags em produtos pagos e o SDK RN é menos integrado ao Expo. Decisão final na spec, revalidando os planos free na época.
- Eventos mínimos: cadastro iniciado/concluído, login, criação de transação, uso do seletor de mês, tela aberta (web e mobile com os mesmos nomes de evento).
- Privacidade: nada de dados financeiros nos eventos (valores, descrições); só ações e contagens.

## Notas de cadastro/perfil (6.6), para a spec futura

- Campos novos: data de nascimento, gênero (opcional, com "prefiro não dizer"); avaliar telefone. Migration na tabela `users` + schema Zod compartilhado.
- Critério de senha: adotar escala fraca/moderada/forte com aceite mínimo definido na spec (ex.: mínimo 8 chars + não estar em lista de senhas vazadas; "forte" = 12+ com variedade de classes). Avaliar `zxcvbn` (mede entropia real em vez de regras arbitrárias) com medidor visual nas telas de cadastro/redefinição.
- Outras práticas a avaliar na spec: verificação de email obrigatória (Better Auth já suporta), rate limit nos endpoints de auth, bloqueio após N tentativas.

## Notas do safe area (6.7)

- Sintoma: no APK, o título da aba (ex.: "Faturas") fica sob a barra de status/notificações do Android.
- Direção: aplicar `useSafeAreaInsets()` (ou `SafeAreaView`) como padding-top no layout das telas de tab. Correção pequena; pode ser puxada a qualquer momento sem spec.

## Notas de design do iOS (6.3)

- Mesmo código Expo; o trabalho é ajuste de plataforma (permissões, ícones, splash), conta Apple Developer e publicação. Sem reescrita.

**Definition of Done (por item):** cada item só é considerado quando tiver sua própria spec aprovada e plano detalhado, fora deste mapa.
