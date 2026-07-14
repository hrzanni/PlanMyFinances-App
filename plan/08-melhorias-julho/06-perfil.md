# Tópico 6 — Perfil: redesenho completo + mudanças no cadastro

> Sem sobreposição de arquivo com outros tópicos — pode rodar 100% em paralelo com qualquer um deles.

## Pedido original do Hugo

> Tela perfil deve ser completamente redesenhada: deve ter foto (usuário consegue colocar ou mudar) e os dados dele, além das mudanças na criação do perfil da pessoa.

## Estado atual (mapeado em 2026-07-13)

- `users.image` **já existe** no schema do Better Auth (`apps/api/src/db/schema/auth.ts:9`, `text`, nullable) mas não é usado em lugar nenhum: fora de `publicColumns` no service (`apps/api/src/services/users.ts:4`), não retornado por `me`, nenhuma UI exibe ou edita.
- Router `users` (`apps/api/src/trpc/routers/users.ts`, 24 linhas) só tem `me` e `updateName` — nada de `updateImage`.
- Tela de perfil web (`apps/web/src/app/(app)/perfil/page.tsx`, 91 linhas) e mobile (`apps/mobile/app/mais/perfil.tsx`, 75 linhas) são espelhadas: nome editável, email somente leitura, botão Salvar, botão Sair. Sem foto, sem outros dados.
- Cadastro hoje (web `apps/web/src/app/(auth)/cadastro/page.tsx`, mobile `apps/mobile/app/cadastro.tsx`) só pede nome, email, senha (mínimo 8 caracteres). Nada de foto, data de nascimento, gênero, telefone, confirmação de senha ou termos.
- **Não existe nenhuma infraestrutura de upload de arquivo no projeto** — confirmado por busca ampla (sem `multer`, `@fastify/multipart`, `expo-image-picker`, S3/Cloudinary/Supabase Storage, nenhuma rota de upload em nenhum app). Precisa ser criada do zero.
- Backlog 6.6 já documentado em `plan/06-backlog/README.md:14,31-35` cobre: data de nascimento, gênero, telefone (avaliar), critério de senha fraca/moderada/forte (`zxcvbn`), verificação de email, rate limit. **Não menciona foto de perfil** — é um requisito novo, não coberto pelo 6.6 atual.

## Decisões de produto em aberto

### 1. Onde guardar a foto
Não há storage de arquivos no projeto. Opções:
- **Opção A (recomendada) — object storage S3-compatible externo** (ex. Cloudflare R2, free tier generoso e sem taxa de saída) com upload direto do cliente via URL pré-assinada: API (Fastify no Render) gera a URL assinada (`users.getUploadUrl`), o cliente faz o PUT direto pro storage, depois chama `users.updateImage({ url })` salvando só a URL em `users.image`. Evita passar binário pelo Fastify no Render free tier (limite de memória apertado).
- **Opção B — proxy de upload pela própria API** (`@fastify/multipart`, a API recebe o arquivo e reenvia pro storage). Mais simples de implementar num primeiro momento, mas consome memória do processo Render free tier a cada upload.

Recomendo A. Confirme com o Hugo antes de escolher o provedor de storage (exige criar conta/credenciais, é uma dependência externa nova).

### 2. Quais campos entram na criação do perfil agora
O Hugo pediu "mudanças na criação do perfil" sem especificar quais. O backlog 6.6 já lista candidatos (nascimento, gênero, telefone, senha mais forte). **Pergunta em aberto para o Hugo:** puxar o 6.6 inteiro para este tópico agora, ou só uma parte? Não assuma — confirme a lista exata antes de implementar essa parte (a foto de perfil pode avançar independente, já que é um pedido concreto).

## Mudança necessária (parte concreta — foto de perfil, assumindo Opção A)

**API:**
- `apps/api/src/services/users.ts`: incluir `image` em `publicColumns`; nova função `updateUserImage`.
- Novo endpoint/procedure para gerar URL de upload assinada (integração com o storage escolhido).
- Router `users`: `getUploadUrl` e `updateImage` (Zod input em `packages/schemas/src/auth.ts`).

**Web:**
- `apps/web/src/app/(app)/perfil/page.tsx`: redesenho com avatar (exibe `user.image` ou iniciais como fallback, já existe lógica de iniciais em algum lugar do rodapé/sidebar — reaproveitar), input de arquivo, fluxo de upload → `getUploadUrl` → PUT → `updateImage`.

**Mobile:**
- `apps/mobile/app/mais/perfil.tsx`: mesmo fluxo, usando `expo-image-picker` (não instalado — adicionar dependência) para escolher/tirar foto.

## Critérios de aceite

- Usuário consegue definir/trocar a foto de perfil nas duas plataformas, e ela aparece salva após reload.
- Tela de perfil redesenhada mostra nome, email e foto (mínimo); demais campos dependem da decisão 2 acima.
- Sem foto definida, mostra um fallback (iniciais ou avatar genérico), nunca ícone quebrado.
- `pnpm lint/typecheck/test/build` verdes.
