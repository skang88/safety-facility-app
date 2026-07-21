import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: true,
      port: parseInt(env.VITE_PORT || '80'),
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://backend:5000',
          changeOrigin: true,
        },
        '/uploads': {
          target: env.VITE_API_URL || 'http://backend:5000',
          changeOrigin: true,
        }
      }
    }
  }
})
