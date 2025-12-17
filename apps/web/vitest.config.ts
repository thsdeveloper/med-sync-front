import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for React component testing
    environment: 'jsdom',

    // Setup files to run before each test file
    setupFiles: ['./src/test/setup.ts'],

    // Enable global test APIs (describe, it, expect, etc.)
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/*.type.ts',
        'e2e/',
        '.next/',
        'dist/',
        'build/',
        'coverage/',
      ],
      include: ['src/**/*.{ts,tsx}'],
    },

    // Test match patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'e2e', '.next', 'dist'],

    // Timeout for tests (in milliseconds)
    testTimeout: 10000,

    // Hook timeouts
    hookTimeout: 10000,
  },

  resolve: {
    alias: {
      // Match tsconfig.json path aliases
      '@': path.resolve(__dirname, './src'),
      '@medsync/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
})
