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

### Pacotes compartilhados

#### Shared (`packages/shared`)

Exporta schemas Zod, tipos TypeScript e utilitarios usados por ambos os apps:

```ts
import { userSchema } from "@medsync/shared/schemas";
import { formatDate } from "@medsync/shared/utils";
```
