import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    }
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2,
      },
      mangle: {
        // Keep variable names that start with uppercase (React components)
        // but rename local vars using a safe reserved-words-safe approach
        reserved: [],
        toplevel: false,
      },
      format: {
        comments: false,
      },
    },
  },
})
