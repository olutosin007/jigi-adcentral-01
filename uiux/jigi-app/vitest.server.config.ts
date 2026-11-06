import { defineConfig } from 'vitest/config'
import path from 'node:path'

/** API route unit tests (Node; no React / jsdom setup). */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    name: 'server-api',
    globals: true,
    environment: 'node',
    include: ['server/**/*.test.ts'],
  },
})
