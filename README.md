## MedSync Front

Aplicação Next.js 16 que segue Atomic Design para entregar a landing page e o fluxo autenticado das empresas. Utilizamos Supabase para autenticação, Tailwind CSS v4 para estilos e o kit de componentes do [shadcn/ui](https://ui.shadcn.com/).

### Requisitos

- Node 20+
- pnpm (recomendado) ou npm / bun
- Conta Supabase com o projeto configurado

### Configuração

1. Instale as dependências:

```bash
pnpm install
```

2. Crie um arquivo `.env.local` com as credenciais públicas do Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=chave-anon
```

3. Rode o servidor de desenvolvimento:

```bash
pnpm dev
```

A página de login está disponível em [`/login`](http://localhost:3000/login). Usuários autenticados enxergam o avatar com menu no header e são redirecionados caso tentem acessar o login novamente.

### shadcn/ui

O projeto já está inicializado com `components.json`, tokens no `globals.css` e utilitários em `src/lib/utils.ts`. Para adicionar novos componentes basta executar, por exemplo:

```bash
pnpm dlx shadcn@latest add badge
```

Os componentes gerados em `src/components/ui` podem ser reexportados/encapsulados em `src/components/atoms` conforme o padrão atômico.

### Sistema de notificações

- A camada global (`src/app/providers.tsx`) renderiza o `Toaster` do shadcn/sonner.
- Utilize o hook `useToastMessage` (`src/hooks/useToastMessage.ts`) para exibir mensagens padronizadas de sucesso, erro ou informação:

```ts
const { notifyError, notifySuccess } = useToastMessage();
notifyError("Erro ao entrar", { description: "Credenciais inválidas." });
```

Isso garante consistência visual e centraliza ajustes futuros (posição, duração, etc.).

### Testes manuais recomendados

- `pnpm lint` para garantir qualidade estática.
- Fluxo de login (credenciais válidas e inválidas).
- Logout pelo menu do usuário e retorno do botão “Login” no header.
