import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    }
  },
  esbuild: {
    // Keep syntax/whitespace minification but disable identifier renaming.
    // Identifier renaming is what causes TDZ crashes when the minifier
    // assigns the same short name to two variables in overlapping scopes.
    minifyIdentifiers: false,
    minifySyntax: true,
    minifyWhitespace: true,
  },
  build: {
    // Use esbuild (default, fast) but override identifier mangling above.
    minify: 'esbuild',
  },
})
