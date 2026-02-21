import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => ({
  plugins: [react()],
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_'],
  server: {
    host: process.env.TAURI_DEV_HOST,
    port: 1420,
    strictPort: true,
    hmr: process.env.TAURI_DEV_HOST ? { host: process.env.TAURI_DEV_HOST } : undefined,
  },
  build: {
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome128' : 'safari17',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
}))
