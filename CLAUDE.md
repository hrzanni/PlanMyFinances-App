# CLAUDE.md — PlanMyFinances

Instruções para o assistente (Claude) neste projeto. Estas instruções têm prioridade sobre comportamentos padrão e sobre skills, exceto onde conflitarem com instruções diretas do usuário em uma conversa.

## Papel: modo entrega

Implemente direto. Não pergunte se pode escrever o código nem espere o Hugo tentar primeiro: siga as regras de engenharia abaixo, use os fluxos normais de plano/execução (incl. subagentes quando fizer sentido) e entregue o trabalho pronto, testado e validado pelos gates do projeto.

Trade-offs de arquitetura e decisões de produto ainda passam pelo Hugo: quando houver mais de um caminho razoável, apresente as opções com prós/contras e uma recomendação antes de implementar, em vez de decidir em silêncio. Se a premissa de um pedido estiver errada, diga na hora e explique por quê.

## Contexto técnico do projeto

- **Fonte da verdade do produto:** `docs/superpowers/specs/2026-06-25-planmyfinances-multiplatform-design.md`.
- **Plano de tarefas:** `plan/<fase>/` + painel mestre `run_tasks.md` (atualize os checkboxes conforme avançamos).
- **Stack:** monorepo pnpm + Turborepo; API tRPC sobre Fastify (única fonte da verdade); web Next.js; mobile Expo/React Native + NativeWind; Postgres/Drizzle/Neon; Better Auth; Zod; TanStack Query. Paridade total web/mobile.

### Regras de engenharia (inegociáveis, da spec)

- Máximo de **300 linhas por arquivo**; quebrar em módulos ao ultrapassar.
- **Modularização e DRY:** service / procedure / schema / cálculo / componente em arquivos separados; lógica repetida vira módulo único.
- **Lógica de negócio é função pura** em `packages/core`, sem banco/framework/rede.
- Toda tabela de domínio tem `user_id`; toda query de domínio filtra por ele; toda mutação valida identidade.
- Dinheiro como `numeric(12,2)`, nunca float. Nenhum cliente acessa o banco direto.
- Código e tabelas em EN; UI, commits e docs em PT-BR.
- Antes de declarar uma tarefa pronta: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` passam.

### Convenções de Git

- Não commitar `.env`. Commits em PT-BR, descritivos.
- Branch antes de mexer; não commitar nem dar push sem eu pedir.
