# Tarefas 1.9–1.10 — CI e Qualidade (GitHub Actions + SonarCloud)

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/sonar.yml`
- Create: `sonar-project.properties`

**Interfaces:**
- Consumes: scripts raiz `lint`/`typecheck`/`test`/`build` (tarefa 1.1) e a cobertura lcov do Vitest (tarefa 1.4).
- Produces: gate de PR. Nenhum merge sem CI verde + Quality Gate verde.

**Pré-requisitos (uma vez, fora do código):**
- Conectar o repositório público ao SonarCloud, criar a organização e o projeto.
- Adicionar secret `SONAR_TOKEN` no GitHub (Settings → Secrets → Actions).
- Definir o Quality Gate no SonarCloud (cobertura mínima, zero novos bugs/vulnerabilidades, duplicação ≤ limite).

---

## 1.9 — CI

- [ ] **Passo 1: `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Passo 2: Validar localmente que cada etapa passa**

Run: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: todas verdes. (Os testes que tocam banco precisam de `DATABASE_URL` de teste; no CI, usar um branch Neon de teste via secret, ou marcar testes de integração para rodar só quando `DATABASE_URL` estiver presente.)

- [ ] **Passo 3: Commit**

```bash
git add .github/workflows/ci.yml && git commit -m "ci: workflow de CI (lint, typecheck, test, build)"
```

---

## 1.10 — SonarCloud

- [ ] **Passo 4: `sonar-project.properties`**

```
sonar.organization=SUA_ORG
sonar.projectKey=SUA_ORG_planmyfinances
sonar.sources=apps,packages
sonar.tests=apps,packages
sonar.test.inclusions=**/*.test.ts
sonar.exclusions=**/dist/**,**/.next/**,**/.expo/**,**/drizzle/**
sonar.javascript.lcov.reportPaths=packages/core/coverage/lcov.info,apps/api/coverage/lcov.info
```

> Substituir `SUA_ORG` pela organização criada no SonarCloud.

- [ ] **Passo 5: `.github/workflows/sonar.yml`**

```yaml
name: Quality
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  sonar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }   # análise de PR precisa do histórico
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test -- --coverage
      - uses: SonarSource/sonarcloud-github-action@v3
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

- [ ] **Passo 6: Garantir cobertura lcov nos pacotes testados**

Confirmar que `packages/core/vitest.config.ts` (tarefa 1.4) e o do `apps/api` emitem `coverage.reporter: ['text','lcov']`. Sem lcov, o Sonar reporta 0% de cobertura e o gate reprova.

- [ ] **Passo 7: Abrir PR de teste e verificar os dois checks**

Criar um PR qualquer. Expected: aparecem os checks "CI / build" e "Quality / sonar", ambos verdes; o SonarCloud comenta a análise no PR. Reprovar deliberadamente (ex.: duplicar um bloco) e confirmar que o Quality Gate barra (valida RE-003).

- [ ] **Passo 8: Commit**

```bash
git add .github/workflows/sonar.yml sonar-project.properties
git commit -m "ci: análise SonarCloud com quality gate no PR"
```

---

## Fechamento da Fase 1

- [ ] Marcar todas as subtarefas 1.x como `[x]` no `run_tasks.md`.
- [ ] Registrar no changelog do `run_tasks.md` (data ISO) a conclusão da fundação.
- [ ] Confirmar Definition of Done do `README.md` da fase.
