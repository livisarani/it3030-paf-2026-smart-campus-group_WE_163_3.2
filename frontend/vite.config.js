import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/oauth2/authorize': { target: 'http://localhost:8080', changeOrigin: true },
      '/oauth2/callback': { target: 'http://localhost:8080', changeOrigin: true }
    }
  }
})