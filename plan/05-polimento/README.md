# Fase 5 — Polimento · Mapa de tarefas

> Detalhe a nível de passos será escrito quando chegarmos.

**Goal:** levar web e mobile ao padrão de acabamento: consistência do tema Nexforce, edge cases, estados de erro/loading, acessibilidade básica e verificação E2E.

**Depende de:** Fases 2, 3 e 4 funcionais.

> Nota: o tema Nexforce (claro/escuro) já é aplicado desde as fases 2 e 3 (spec amendment 2026-07-06, seção 6). Aqui é auditoria de consistência, não criação.

| # | Subtarefa | Objetivo / entregável | Refs |
|---|---|---|---|
| 5.1 | Auditoria do tema | tokens de cor/spacing/radius consistentes nas duas plataformas, claro e escuro; verde=entrada, vermelho=saída em todos os valores | FR-090/093/150 |
| 5.2 | Edge cases | mês vazio, transação sem categoria, sem `due_date`, parcela única, lista vazia, offline mobile, `due_day` 31 em mês curto, pasta arquivada, mês futuro em gastos fixos | Edge Cases (spec base + amendment) |
| 5.3 | Erro/loading | estados padronizados nos dois clientes; retry de rede no mobile; erros de sync Pluggy visíveis | tabelas de Error Handling |
| 5.4 | Acessibilidade | contraste AA nos dois temas (SC-103), foco, labels | amendment seção 6 |
| 5.5 | Verificação E2E manual | roteiro SC-009 estendido com SC-100 (gastos fixos ponta a ponta), SC-101 (pastas) e SC-102 (sync idempotente), na web e no mobile; registrar resultado | SC-004/009/100/101/102 |

**Definition of Done da fase:** tema consistente; nenhum edge case quebra a UI; roteiro estendido verde nas duas plataformas; checklist de acessibilidade cumprido.
