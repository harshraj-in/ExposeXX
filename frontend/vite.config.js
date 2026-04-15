import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false, // fall back to next available port if taken
    proxy: {
      '/api': {
        target: 'https://exposexx-1.onrender.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
