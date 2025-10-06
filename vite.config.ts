import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // This makes paths relative instead of absolute
  build: {
    outDir: 'dist'
  }
})
