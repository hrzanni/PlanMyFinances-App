# Fase 4 — Polimento · Mapa de tarefas

> Detalhe a nível de passos será escrito quando chegarmos.

**Goal:** levar web e mobile ao padrão de acabamento: tema, identidade visual, edge cases, estados de erro/loading, acessibilidade básica e verificação E2E.

**Depende de:** Fases 2 e 3 funcionais.

| # | Subtarefa | Objetivo / entregável | Refs |
|---|---|---|---|
| 4.1 | Tema claro/escuro | tokens compartilhados de cor/spacing/radius aplicados nas duas plataformas | FR-090, SHOULD da spec |
| 4.2 | Identidade visual | paleta final via skill `frontend-design`, mantendo verde=entrada, vermelho=saída | FR-093 |
| 4.3 | Edge cases | mês vazio, transação sem categoria, sem `due_date`, parcela única, lista vazia, offline mobile | seção Edge Cases da spec |
| 4.4 | Erro/loading | estados padronizados nos dois clientes; retry de rede no mobile | tabela de Error Handling |
| 4.5 | Acessibilidade | contraste, foco, labels nos dois clientes | boa prática |
| 4.6 | Verificação E2E manual | rodar o roteiro SC-009 na web e no mobile, registrar resultado | SC-004/009 |

**Definition of Done da fase:** tema consistente; nenhum edge case quebra a UI; SC-009 verde nas duas plataformas; checklist de acessibilidade básica cumprido.
