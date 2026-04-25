import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // followRedirects: true would be needed for non-trailing-slash routes
      },
    },
  },

  build: {
    // Chunk splitting for better caching — vendor libs separate from app code
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (['react', 'react-dom', 'react-router-dom'].some(p => id.includes(`/node_modules/${p}/`))) return 'vendor';
            if (id.includes('/node_modules/recharts/'))  return 'charts';
            if (id.includes('/node_modules/xlsx/'))      return 'xlsx';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },

  // Vitest configuration
  test: {
    environment: 'node',
    globals: true,
  },
})
