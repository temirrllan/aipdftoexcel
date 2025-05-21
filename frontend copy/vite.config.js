// vite.config.js
import { defineConfig } from 'vite'
import react      from '@vitejs/plugin-react'
import path       from 'path'

export default defineConfig({
  plugins: [ react() ],
  resolve: {
    alias: {
      // теперь '@' указывает на папку 'src'
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
