## MedSync

Monorepo com Turborepo contendo a aplicação web (Next.js 16) e mobile (Expo/React Native) do MedSync - plataforma administrativa para gestao clinica.

### Estrutura

```
medsync/
├── apps/
│   ├── web/          # @medsync/web - Next.js 16, Tailwind v4, shadcn/ui
│   └── mobile/       # @medsync/mobile - Expo SDK 54, React Native
├── packages/
│   └── shared/       # @medsync/shared - schemas, types, utils compartilhados
├── turbo.json        # Configuracao do Turborepo
└── pnpm-workspace.yaml
```

### Requisitos

- Node 18+
- pnpm 9+
- Conta Supabase com o projeto configurado

### Instalacao

```bash
pnpm install
```

### Variaveis de ambiente

Crie `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=chave-anon
RESEND_API_KEY=re_xxx  # opcional, para envio de emails
```

### Scripts

```bash
# Desenvolvimento
pnpm dev              # Roda todos os apps
pnpm dev:web          # Apenas web (Next.js)
pnpm dev:mobile       # Apenas mobile (Expo)

# Build e verificacao
pnpm build            # Build de todos os pacotes
pnpm build:web        # Build apenas web
pnpm lint             # Lint em todos os pacotes
pnpm typecheck        # Verificacao de tipos

# Limpeza
pnpm clean            # Remove node_modules e cache
```

### Apps

#### Web (`apps/web`)

Aplicacao Next.js 16 com Atomic Design, Tailwind CSS v4 e [shadcn/ui](https://ui.shadcn.com/).

Para adicionar componentes shadcn:

```bash
cd apps/web
pnpm dlx shadcn@latest add badge
```

#### Mobile (`apps/mobile`)

Aplicacao Expo com React Native e expo-router.

```bash
pnpm dev:mobile       # Inicia com tunnel (ngrok)
```

### Testing

#### End-to-End Tests

The web application includes comprehensive e2e tests using Playwright:

```bash
# Run all e2e tests (headless mode)
pnpm --filter @medsync/web test:e2e

# Run tests with UI mode (recommended for development)
pnpm --filter @medsync/web test:e2e:ui

# Run tests in headed mode (visible browser)
pnpm --filter @medsync/web test:e2e:headed

# Debug tests step-by-step
pnpm --filter @medsync/web test:e2e:debug

# View test report
pnpm --filter @medsync/web test:e2e:report
```

**Test Coverage**: 140+ comprehensive tests for calendar functionality including:
- Date navigation controls (Hoje/Anterior/Próximo)
- Month and year selectors
- View mode switching (Mês/Semana/Dia/Agenda)
- Combined filter scenarios
- URL state persistence and browser history
- Edge cases (leap years, month boundaries, rapid interactions)

For detailed testing documentation, setup instructions, and CI/CD configuration, see [`apps/web/e2e/README.md`](./apps/web/e2e/README.md).

### Pacotes compartilhados

#### Shared (`packages/shared`)

Exporta schemas Zod, tipos TypeScript e utilitarios usados por ambos os apps:

```ts
import { userSchema } from "@medsync/shared/schemas";
import { formatDate } from "@medsync/shared/utils";
import { useEspecialidades } from "@medsync/shared/hooks";
```

---

## Database Migrations

### Recent Migrations

#### Especialidade Refactoring (December 2025)

The medical staff specialty system was refactored from a free-text `specialty` field to a normalized foreign key relationship (`especialidade_id`). This migration:

- ✅ **Created `especialidades` table** with 30 seeded medical specialties
- ✅ **Migrated all data** from text to foreign key (100% success rate)
- ✅ **Improved data quality** - eliminated typos, inconsistencies, and variations
- ✅ **Enhanced UX** - searchable dropdown instead of free-text input
- ✅ **Dropped deprecated column** - cleaned up `specialty` text field

**Migration Files**:
- `migrations/20251215_create_especialidades_table.sql`
- `migrations/20251215_migrate_medical_staff_specialty.sql`
- `migrations/20251215_drop_especialidade_column.sql`

**Full Documentation**: See [`docs/migrations/ESPECIALIDADE_REFACTORING.md`](./docs/migrations/ESPECIALIDADE_REFACTORING.md) for complete details, rollback plan, and lessons learned.

**Breaking Change**: The `specialty` text field has been removed. Use `especialidade_id` foreign key and JOIN the `especialidades` table:

```typescript
// ❌ OLD (deprecated)
const { data } = await supabase
  .from('medical_staff')
  .select('id, name, specialty');

// ✅ NEW (current)
const { data } = await supabase
  .from('medical_staff')
  .select('id, name, especialidade:especialidades(id, nome)');

// Access: data.especialidade?.nome
```
