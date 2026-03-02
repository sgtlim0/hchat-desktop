import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/__tests__/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/app/**',
        'src/pages/**',
        'src/widgets/**',
        'src/server/**',
        'src/shared/lib/bedrock-client.ts',
        'src/shared/lib/db.ts',
        'src/shared/lib/mock-data.ts',
        'src/shared/lib/pdf-extractor.ts',
        'src/shared/lib/providers/factory.ts',
        'src/shared/lib/providers/openai.ts',
        'src/shared/lib/providers/gemini.ts',
        'src/shared/lib/providers/types.ts',
        'src/shared/lib/stt.ts',
        'src/shared/lib/tts.ts',
        'src/shared/types/**',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})
