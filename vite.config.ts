import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    // scribe.js-ocr uses worker entrypoints that break when pre-bundled by Vite dep optimizer
    exclude: ['scribe.js-ocr'],
  },
})
