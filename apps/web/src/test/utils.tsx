/**
 * Test Utilities
 *
 * This file provides custom render functions and test utilities that wrap
 * components with necessary providers (React Query, Theme, etc.).
 *
 * Usage:
 * ```tsx
 * import { render, screen } from '@/test/utils'
 *
 * test('renders component', () => {
 *   render(<MyComponent />)
 *   expect(screen.getByText('Hello')).toBeInTheDocument()
 * })
 * ```
 */

import { ReactElement, ReactNode } from 'react'
import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import type { SupabaseClient } from '@supabase/supabase-js'
import { vi } from 'vitest'

/**
 * Creates a new QueryClient instance for testing
 * with optimized settings to prevent unnecessary retries and logging
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests
        retry: false,
        // Disable caching to ensure fresh data in each test
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        // Disable retries in tests
        retry: false,
      },
    },
  })
}

/**
 * Mock Supabase client for testing
 * Returns a minimal implementation that can be customized per test
 */
export function createMockSupabaseClient(): Partial<SupabaseClient> {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    } as any,
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    } as any,
  }
}

/**
 * Custom render options that extend RTL's RenderOptions
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Custom QueryClient instance
   * If not provided, a new test client will be created
   */
  queryClient?: QueryClient

  /**
   * Initial theme for ThemeProvider
   * @default 'light'
   */
  theme?: 'light' | 'dark' | 'system'

  /**
   * Mock Supabase client instance
   * If provided, it will be available to components that use Supabase
   */
  supabaseClient?: Partial<SupabaseClient>
}

/**
 * Custom render function that wraps components with necessary providers
 *
 * @example
 * ```tsx
 * // Basic usage
 * render(<MyComponent />)
 *
 * // With custom QueryClient
 * const queryClient = createTestQueryClient()
 * render(<MyComponent />, { queryClient })
 *
 * // With dark theme
 * render(<MyComponent />, { theme: 'dark' })
 * ```
 */
export function render(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    queryClient = createTestQueryClient(),
    theme = 'light',
    supabaseClient,
    ...renderOptions
  } = options

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme={theme}
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    )
  }

  return {
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
    supabaseClient,
  }
}

/**
 * Re-export everything from React Testing Library
 * This allows test files to import everything from a single location:
 * import { render, screen, fireEvent } from '@/test/utils'
 */
export * from '@testing-library/react'

/**
 * Export userEvent as a named export for convenience
 * @example
 * import { render, userEvent } from '@/test/utils'
 *
 * test('user interaction', async () => {
 *   render(<Button>Click me</Button>)
 *   await userEvent.click(screen.getByText('Click me'))
 * })
 */
export { default as userEvent } from '@testing-library/user-event'

/**
 * Utility function to wait for React Query queries to finish loading
 * Useful when testing components that fetch data on mount
 *
 * @example
 * ```tsx
 * test('loads data', async () => {
 *   const { queryClient } = render(<MyComponent />)
 *   await waitForQueryClient(queryClient)
 *   expect(screen.getByText('Data loaded')).toBeInTheDocument()
 * })
 * ```
 */
export async function waitForQueryClient(queryClient: QueryClient) {
  await queryClient.cancelQueries()
  await queryClient.invalidateQueries()
}

/**
 * Mock Next.js router
 * Use this in tests that require router functionality
 *
 * @example
 * ```tsx
 * import { mockRouter } from '@/test/utils'
 *
 * beforeEach(() => {
 *   mockRouter.push = vi.fn()
 * })
 *
 * test('navigates on click', async () => {
 *   render(<NavButton />)
 *   await userEvent.click(screen.getByText('Navigate'))
 *   expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
 * })
 * ```
 */
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  basePath: '',
  isFallback: false,
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
}
