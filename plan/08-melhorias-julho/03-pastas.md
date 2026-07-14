# Tópico 3 — Pastas: remover campo de emoji

> Sem sobreposição de arquivo com outros tópicos — pode rodar 100% em paralelo com qualquer um deles.

## Pedido original do Hugo

> Pastas: tirar o campo de adicionar emoji.

## Estado atual (mapeado em 2026-07-13)

- Coluna já é `icon` (não `emoji`), já opcional/nullable — `apps/api/src/db/schema/folders.ts`. Não precisa de migration para remover a coluna; basta parar de enviar valor (ou remover a coluna depois, à parte, se quiser limpar de vez).
- Zod (`packages/schemas/src/folders.ts`) — `icon` já é `.optional()`/`.nullable().optional()` em `createFolderInput`/`updateFolderInput`. Nenhuma mudança necessária aqui.
- Router/service (`apps/api/src/trpc/routers/folders.ts`, `apps/api/src/services/folders.ts`) — fazem spread genérico do input, sem tratamento específico de `icon`. Nenhuma mudança necessária.
- **Campo a remover (web):** `apps/web/src/app/(app)/pastas/page.tsx` — estado `icon` (linha ~155), `<Input id="folder-icon" ...>` (linhas ~202-223, ao lado do nome num grid `1fr_5rem`), e o `icon: icon || undefined` no `create.mutate` (linha ~172).
- **Campo a remover (mobile):** `apps/mobile/app/mais/pastas.tsx` — estado `icon` (linha ~91), `<Input label="Emoji (opcional)" ...>` (linha ~131), e `icon: icon || undefined` no `submit()` (linha ~108).
- **Exibição legada** (não é obrigatório mexer, mas decida): o emoji de pastas já criadas continua aparecendo em 6 lugares que já fazem fallback gracioso (`icon ? ... : ''`) — cards de pasta (web/mobile), `FolderBadge` (`apps/web/src/components/tx-badges.tsx:17-24`), select de pasta no form de transação web (`apps/web/src/components/transaction-form.tsx:158-163`), filtro/badge do Histórico web, e chip de pasta no form mobile (`apps/mobile/src/components/tx-form-modal.tsx:126-129`).

## Decisão de produto (baixo risco, mas confirme)

Remover só o campo de **entrada** (o que o Hugo pediu) e deixar a exibição legada como está — pastas antigas continuam mostrando o emoji que já tinham, pastas novas não ganham nenhum. É o caminho de menor esforço e não quebra nada, já que os 6 pontos de exibição já toleram ausência de emoji. Alternativa (maior escopo, não pedida): apagar a coluna via migration e limpar os 6 pontos de exibição, perdendo o emoji das pastas já criadas. Recomendo a primeira opção — só remover os dois inputs — a menos que o Hugo diga o contrário.

## Mudança necessária

- `apps/web/src/app/(app)/pastas/page.tsx`: remover estado, input e campo do payload relacionados a `icon`.
- `apps/mobile/app/mais/pastas.tsx`: idem.
- Nenhuma mudança em schema, Zod, router, service ou packages/core.

## Critérios de aceite

- Criar/editar pasta nas duas plataformas não mostra mais nenhum campo de emoji.
- Pastas criadas antes da mudança continuam exibindo o emoji que já tinham (sem regressão visual).
- `pnpm lint/typecheck/test/build` verdes (nenhum teste depende de `icon`, confirmado no mapeamento — não deve quebrar nada).
