import { defineConfig } from 'vite'

export default defineConfig({
  root: './client',
  build: {
    outDir: '../dist'
  },
  server: {
    port: 3000
  }
})