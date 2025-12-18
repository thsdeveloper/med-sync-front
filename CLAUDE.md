# MedSync - Instruções para Claude Code

## Visão Geral do Projeto

MedSync é uma plataforma de gestão médica com:
- **Web App**: Next.js 15 + React 19 + TypeScript (`apps/web/`)
- **Mobile App**: React Native + Expo (`apps/mobile/`)
- **Schemas compartilhados**: Zod schemas (`packages/shared/`)
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)

## Estrutura do Monorepo

```
medsync-front/
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # React Native mobile app
├── packages/
│   └── shared/       # Shared Zod schemas
├── package.json      # Root package.json (versão principal)
└── .versionrc.json   # Configuração do versionamento
```

## Commits - Conventional Commits (OBRIGATÓRIO)

**SEMPRE** use o padrão Conventional Commits para mensagens de commit:

### Formato
```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos de Commit

| Tipo | Descrição | Versão |
|------|-----------|--------|
| `feat` | Nova funcionalidade | minor (0.X.0) |
| `fix` | Correção de bug | patch (0.0.X) |
| `docs` | Documentação apenas | - |
| `style` | Formatação, sem mudança de código | - |
| `refactor` | Refatoração sem mudar funcionalidade | - |
| `perf` | Melhoria de performance | patch |
| `test` | Adição/correção de testes | - |
| `build` | Mudanças no build/dependências | - |
| `ci` | Mudanças em CI/CD | - |
| `chore` | Tarefas de manutenção | - |

### Breaking Changes (major version)
Para mudanças que quebram compatibilidade:
```
feat!: nova API de autenticação

BREAKING CHANGE: O formato do token mudou de JWT para opaque tokens.
```

### Exemplos
```bash
# Novo recurso
feat(chat): adiciona suporte a anexos de documentos

# Correção de bug
fix(calendar): corrige navegação entre meses

# Refatoração
refactor(auth): extrai lógica de validação para hook

# Com escopo
feat(mobile): implementa upload de avatar
```

## Versionamento Automático

O projeto usa `commit-and-tag-version` para versionamento semântico automático.

### Comandos

```bash
# Gera versão automaticamente baseada nos commits
pnpm release

# Força um tipo específico
pnpm release:patch   # 0.1.0 → 0.1.1
pnpm release:minor   # 0.1.0 → 0.2.0
pnpm release:major   # 0.1.0 → 1.0.0

# Teste sem fazer mudanças
pnpm release:dry
```

### O que o release faz:
1. Analisa commits desde a última tag
2. Determina próxima versão (baseado nos tipos de commit)
3. Atualiza `package.json` (raiz) e `apps/web/package.json`
4. Gera/atualiza `CHANGELOG.md`
5. Cria commit de release
6. Cria tag git (ex: `v0.2.0`)

### Após o release:
```bash
git push --follow-tags origin main
```

## Comandos Úteis

```bash
# Desenvolvimento
pnpm dev:web          # Inicia web app
pnpm dev:mobile       # Inicia mobile app

# Build
pnpm build:web        # Build do web app

# Qualidade
pnpm lint             # ESLint
pnpm typecheck        # TypeScript check

# Testes
pnpm test             # Testes unitários (Vitest)
pnpm test:e2e         # Testes E2E (Playwright)
```

## Banco de Dados (Supabase)

- Migrações ficam em `apps/web/supabase/migrations/`
- Sempre crie migrações para mudanças de schema
- Use RLS (Row Level Security) em todas as tabelas

## Padrões de Código

- **Componentes**: Atomic Design (atoms, molecules, organisms)
- **Estado**: React Query (TanStack Query) para server state
- **Formulários**: React Hook Form + Zod
- **Estilização**: Tailwind CSS + shadcn/ui
- **Tabelas**: TanStack Table

## Versão Atual

A versão é exibida no sidebar (`AppSidebar.tsx`) e lida do `package.json`.
