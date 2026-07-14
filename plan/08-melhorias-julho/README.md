# Fase 8 — Melhorias de julho/2026 · Mapa de distribuição por tópico

> Pedidos do Hugo em 2026-07-13, mapeados no código para distribuição a múltiplos agentes trabalhando em paralelo. Cada arquivo `0N-*.md` é autossuficiente: contém pedido original, estado atual (com arquivo:linha), mudança necessária, decisões de produto em aberto e critérios de aceite. Aponte o agente direto para o arquivo do tópico dele.

## Como rodar em paralelo sem conflito

Cada agente deve:
1. Ler `CLAUDE.md` na raiz (regras de engenharia: máx. 300 linhas/arquivo, DRY, lógica de negócio pura em `packages/core`, toda query de domínio filtra por `user_id`, dinheiro em `numeric(12,2)`, código em EN/UI em PT-BR).
2. Trabalhar em branch própria (idealmente worktree isolada — `superpowers:using-git-worktrees`).
3. Antes de declarar pronto: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` verdes, mais verificação manual em runtime (web no navegador, mobile via Expo Go/bundle — recipe em `.claude/skills/verify/SKILL.md`).
4. Quando houver mais de um caminho razoável, apresentar as opções com prós/contras e recomendação ao Hugo antes de implementar — não decidir sozinho. Cada tópico já lista as decisões que identifiquei como abertas.

## Matriz de conflito (mesmos arquivos, não rodar 100% em paralelo)

| Par | Arquivos em comum | Recomendação |
|---|---|---|
| **01 (Cobranças)** × **02 (Faturas/Cartões)** | `apps/web/src/components/installment-form-fields.tsx`, `apps/mobile/src/components/installment-form-modal.tsx`, `apps/mobile/src/components/installment-list.tsx` — hoje um único componente genérico parametrizado por `kind` atende os dois | Mesmo agente/worktree para os dois, em sequência: primeiro separar o componente genérico em dois (parte do escopo do 01), depois 02 evolui só o lado de fatura/cartão. Se forem agentes diferentes, 01 termina e faz merge antes de 02 começar. |
| **04 (Transações/tags)** × **05 (Início)** | `apps/web/src/app/(app)/page.tsx` (04 mexe no card "Últimas transações", 05 mexe na seção de gráficos, mesmo arquivo) | Mesmo agente, ou 04 termina e faz merge antes de 05 começar. |

Os demais tópicos (03 Pastas, 06 Perfil) não têm sobreposição de arquivo com nenhum outro — podem rodar 100% em paralelo com qualquer coisa.

## Índice

| # | Tópico | Arquivo | Área principal |
|---|---|---|---|
| 1 | Cobranças — editar status/recebido + virar receita | `01-cobrancas.md` | `apps/api/.../charges.ts`, `apps/web/.../cobrancas`, `apps/mobile/.../cobrancas.tsx` |
| 2 | Faturas → Cartões | `02-faturas-cartoes.md` | `apps/api/.../invoices.ts`, telas de faturas nas duas plataformas |
| 3 | Pastas — remover campo de emoji | `03-pastas.md` | telas de pastas nas duas plataformas |
| 4 | Adicionar transação — subcategoria + tags | `04-transacoes-subcategoria-tags.md` | form de transação, histórico, card "Últimas transações" |
| 5 | Início — logo + gráfico de pizza | `05-inicio-logo-grafico.md` | sidebar web, seção de gráficos da Início |
| 6 | Perfil — redesenho completo + cadastro | `06-perfil.md` | router `users`, telas de perfil e cadastro |

## Depois que um tópico terminar

Atualize `run_tasks.md` (Fase 8, criada nesta sessão) marcando a subtarefa correspondente e acrescente uma linha no changelog com a data ISO.
