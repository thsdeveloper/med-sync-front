# Agent.md

Guia rápido para agentes de IA compreenderem o projeto **MedSync Front** e colaborarem com eficiência.

## 1. Visão Geral
- **Stack:** Next.js 16 (app router), React 19, TypeScript, Tailwind/shadcn UI.
- **Domínio:** Plataforma administrativa para gestão clínica (equipes, escalas, relatórios, etc.).
- **Back-end:** Supabase (auth, banco, RPC). Integrações adicionais: Resend (envio de e-mails).

## 2. Estrutura Essencial
- `src/app/dashboard/*`: páginas principais após login (`equipe`, `escalas`, `relatorios`…).
- `src/components/atoms|molecules|organisms`: design system incremental.
- `src/components/ui/*`: componentes shadcn gerados (Button, Card, Sheet…).
- `src/lib/supabase.ts`: client-side supabase.
- `src/lib/reports.ts`: geração/normalização de métricas de relatórios.
- `src/hooks/useReportExport.ts`: exportação/serialização de PDFs.
- `src/app/api/*`: rotas internas (ex.: `/api/reports/email` usa Resend).

## 3. Fluxos Relevantes
- **Relatórios (/dashboard/relatorios):**
  1. Busca `reports_dashboard_metrics` via Supabase RPC.
  2. `ReportFilters` controla período/especialidade/unidade.
  3. Gráficos usam `ReportAreaChart` (Recharts + shadcn).
  4. `useReportExport` gera PDF (html2canvas + jsPDF).
  5. `ReportEmailSheet` dispara `/api/reports/email` anexando o PDF em base64.
- **Equipes (/dashboard/equipe):** CRUD com Supabase (tabela `medical_staff`).

## 4. Dependências & Scripts
- Rodar `npm install` após alterações em `package.json`.
- Scripts: `npm run dev`, `npm run build`, `npm run lint`.
- Novas libs chave: `recharts`, `html2canvas`, `jspdf`, `@react-email/components`.
- Variáveis esperadas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `RESEND_API_KEY`.

## 5. Convenções e Dicas
- Usar `cn` de `src/lib/utils.ts` para classes Tailwind condicionais.
- Componentes interativos em client-side precisam de `'use client'`.
- Evitar reverter alterações do usuário; preferir `apply_patch` para mudanças pontuais.
- Lint: rodar `npm run lint` ou `read_lints` pós-modificações significativas.

## 6. Pendências/Ideias Futuras
- Conectar métricas reais no Supabase (`reports_dashboard_metrics`).
- Melhorar templates de e-mail (incluir branding, gráficos em miniatura).
- Adicionar testes (unitários/E2E) para fluxos críticos (exportação, envio, filtros).

## 7. Referências
- Area charts padrão: https://ui.shadcn.com/charts/area
- Documentação Supabase: https://supabase.com/docs
- Resend API: https://resend.com/docs/api-reference

Siga estas notas ao atuar como agente para manter consistência e contexto do projeto. Boa colaboração! 💡


