// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
