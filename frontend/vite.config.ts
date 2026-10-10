import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwind from "@tailwindcss/vite"
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // URL do seu backend Express
        changeOrigin: true,
      },
    },
  },
  build: {
    assetsInlineLimit: 0,
    manifest: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: ['**/node_modules/**', '**/dist/**'],
    fileParallelism: false,
    maxWorkers: 1,
  },
})
