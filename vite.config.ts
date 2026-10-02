import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Full play-through tests click through every challenge and can exceed
    // the 5s default on a busy machine.
    testTimeout: 15000,
  },
})
