---
name: verify
description: Como verificar mudanças do PlanMyFinances em runtime (web via browser, API via curl, mobile via bundle do Metro)
---

# Verificação em runtime — PlanMyFinances

## Ambiente local

- Postgres: Docker `pmf-db`, porta **5439** (já costuma estar de pé; `docker ps`).
- API: Fastify na porta **3333** (`pnpm --filter @pmf/api dev`); health em `GET /health`. `AUTH_BYPASS=true` em `apps/api/.env` dispensa cookie.
- Web: Next dev na porta **3005** (`pnpm --filter @pmf/web dev`); `NEXT_PUBLIC_AUTH_BYPASS=true` em `.env.local` pula o login.
- Mobile: Metro via `cd apps/mobile && npx expo start --clear --port 8081`.

## Web (superfície: navegador)

Navegar em `http://localhost:3005/<rota>` com as ferramentas do Chrome. Gotchas:

- Logo após editar código, a primeira carga pode dar "Internal Server Error" ou congelar o screenshot (recompilação quente). Esperar e recarregar; se persistir, reiniciar o dev server.
- **Não clicar em botões de excluir na web via automação**: eles usam `window.confirm`, que congela o CDP. Excluir dados de teste via tRPC (abaixo).

## API (superfície: HTTP/tRPC)

Com `AUTH_BYPASS=true`, sem cookie:

```bash
curl -s 'http://localhost:3333/trpc/charges.list'                       # query
curl -s -X POST 'http://localhost:3333/trpc/charges.delete' \
  -H 'Content-Type: application/json' -d '{"id":"<uuid>"}'             # mutation
```

Sem transformer: input é o JSON puro no body.

## Mobile (superfície real: Expo Go no aparelho)

Sem aparelho/emulador, o máximo verificável é o bundle compilar (pega erros de resolução do Metro, ex. dependência fantasma do pnpm estrito):

```bash
# 1. A URL exata do bundle vem do manifest:
curl -s http://localhost:8081 -H 'expo-platform: android'   # → launchAsset.url
# 2. Baixar o bundle (lazy=false força compilar todas as rotas):
curl -s -o /tmp/bundle.js '<launchAsset.url com lazy=false e sem bytecode>'
# 3. Grep de símbolos novos no bundle confirma que os módulos entraram.
```

Interação de toque (teclado, Alert, chips) fica para teste manual no Expo Go.

## Fluxos que valem dirigir

- Cobranças/Faturas: criar com vírgula no valor ("100,50"), pago > parcela×parcelas → erro RN-004 inline, excluir.
- Categorias: criar sub via chip, excluir sub/categoria (confirmação).
- Sempre limpar dados de teste via tRPC ao final.
