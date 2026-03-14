import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@ext': resolve(__dirname, 'src'),
      '@hchat/shared': resolve(__dirname, '../shared/src'),
    },
  },
})
