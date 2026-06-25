# Tarefa 1.1 — Setup do monorepo

**Files:**
- Create: `package.json` (root), `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore`, `.editorconfig`, `.npmrc`
- Create: `eslint.config.mjs`, `.prettierrc`

**Interfaces:**
- Produces: workspaces `apps/*` e `packages/*`; scripts raiz `lint`, `typecheck`, `test`, `build` que delegam ao Turborepo.

Esta tarefa é configuração; o "teste" é o monorepo instalar e o pipeline rodar vazio sem erro.

- [ ] **Passo 1: Criar `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Passo 2: Criar `package.json` raiz**

```json
{
  "name": "planmyfinances",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.1.0",
    "typescript": "^5.6.0",
    "prettier": "^3.3.0",
    "eslint": "^9.12.0"
  }
}
```

- [ ] **Passo 3: Criar `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

- [ ] **Passo 4: Criar `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "composite": true
  }
}
```

- [ ] **Passo 5: Criar `.gitignore`, `.editorconfig`, `.npmrc`, `.prettierrc`**

`.gitignore`:
```
node_modules
dist
.next
.expo
coverage
*.log
.env
.env.*
!.env.example
.turbo
```

`.npmrc`:
```
auto-install-peers=true
```

`.editorconfig`:
```
root = true
[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
```

`.prettierrc`:
```json
{ "semi": false, "singleQuote": true, "printWidth": 100 }
```

- [ ] **Passo 6: Criar `eslint.config.mjs` (flat config base)**

```js
import tseslint from 'typescript-eslint'

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }]
    }
  },
  { ignores: ['**/dist/**', '**/.next/**', '**/.expo/**', '**/coverage/**'] }
)
```

> A regra `max-lines: 300` cobra a RE-001 no lint, reforçando o que o SonarCloud também mede.

- [ ] **Passo 7: Instalar e verificar**

Run: `pnpm install`
Expected: instala sem erro, cria `pnpm-lock.yaml`.

Run: `pnpm turbo run build`
Expected: "No tasks were executed" ou sucesso vazio (ainda não há apps/packages). Sem erro de config.

- [ ] **Passo 8: Commit**

```bash
git add .
git commit -m "chore: setup do monorepo (pnpm + turborepo + ts base)"
```
