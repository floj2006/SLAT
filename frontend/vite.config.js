import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// proxy: запросы на /api frontend перенаправляет на backend (порт 8000).
// Благодаря этому в коде можно писать просто fetch('/api/groups').
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
