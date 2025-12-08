# Agent.md

Guia rapido para agentes de IA compreenderem o projeto **MedSync** e colaborarem com eficiencia.

## 1. Visao Geral
- **Arquitetura:** Monorepo com Turborepo e pnpm workspaces.
- **Apps:**
  - `@medsync/web` - Next.js 16, React 19, Tailwind v4, shadcn/ui
  - `@medsync/mobile` - Expo SDK 54, React Native, expo-router
- **Pacotes:**
  - `@medsync/shared` - schemas Zod, tipos e utils compartilhados
- **Dominio:** Plataforma administrativa para gestao clinica (equipes, escalas, relatorios).
- **Back-end:** Supabase (auth, banco, RPC). Integracoes: Resend (e-mails).

## 2. Estrutura do Monorepo

```
medsync/
├── apps/
│   ├── web/                    # Aplicacao Next.js
│   │   ├── src/
│   │   │   ├── app/            # App router (dashboard/*, login, etc.)
│   │   │   ├── components/     # atoms | molecules | organisms | ui
│   │   │   ├── hooks/          # useReportExport, useToastMessage, etc.
│   │   │   ├── lib/            # supabase, utils, reports
│   │   │   ├── providers/      # Context providers
│   │   │   └── schemas/        # Schemas locais (migrar para shared)
│   │   └── public/
│   └── mobile/                 # Aplicacao Expo
│       ├── app/                # expo-router
│       ├── components/
│       └── hooks/
└── packages/
    └── shared/                 # Codigo compartilhado
        └── src/
            ├── schemas/        # Zod schemas
            ├── types/          # TypeScript types
            ├── utils/          # Funcoes utilitarias
            └── constants/      # Constantes
```

## 3. Fluxos Relevantes (Web)
- **Relatorios (/dashboard/relatorios):**
  1. Busca `reports_dashboard_metrics` via Supabase RPC.
  2. `ReportFilters` controla periodo/especialidade/unidade.
  3. Graficos usam `ReportAreaChart` (Recharts + shadcn).
  4. `useReportExport` gera PDF (html2canvas + jsPDF).
  5. `ReportEmailSheet` dispara `/api/reports/email` anexando PDF em base64.
- **Equipes (/dashboard/equipe):** CRUD com Supabase (tabela `medical_staff`).
- **Escalas (/dashboard/escalas):** Calendario de plantoes e escalas fixas.

## 4. Scripts e Comandos

```bash
# Na raiz do monorepo
pnpm install              # Instala dependencias de todos os pacotes
pnpm dev                  # Roda todos os apps
pnpm dev:web              # Apenas web
pnpm dev:mobile           # Apenas mobile
pnpm build                # Build de producao
pnpm lint                 # Lint em todos os pacotes
pnpm typecheck            # Verificacao de tipos
pnpm clean                # Limpa node_modules e cache

# Dentro de apps/web
pnpm dlx shadcn@latest add <componente>   # Adiciona componente shadcn
```

## 5. Dependencias Chave
- **Web:** recharts, html2canvas, jspdf, @react-email/components, zod
- **Mobile:** expo-router, react-native-reanimated, @supabase/supabase-js
- **Shared:** zod

## 6. Variaveis de Ambiente
- `apps/web/.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `RESEND_API_KEY` (opcional)

## 7. Convencoes
- Usar `cn` de `apps/web/src/lib/utils.ts` para classes Tailwind condicionais.
- Componentes client-side precisam de `'use client'`.
- Schemas compartilhados devem ir para `@medsync/shared/schemas`.
- Imports do shared: `import { schema } from "@medsync/shared/schemas"`.
- Rodar `pnpm lint` apos modificacoes significativas.

## 8. Pendencias/Ideias Futuras
- Conectar metricas reais no Supabase (`reports_dashboard_metrics`).
- Implementar autenticacao no app mobile.
- Migrar schemas restantes para `@medsync/shared`.
- Adicionar testes (unitarios/E2E) para fluxos criticos.

## 9. Referencias
- Turborepo: https://turbo.build/repo/docs
- shadcn/ui charts: https://ui.shadcn.com/charts/area
- Supabase: https://supabase.com/docs
- Expo: https://docs.expo.dev
- Resend: https://resend.com/docs/api-reference


