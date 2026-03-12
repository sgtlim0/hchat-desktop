import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { cpSync, copyFileSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extension-files',
      closeBundle() {
        const dist = resolve(__dirname, 'dist')
        copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(dist, 'manifest.json'),
        )
        cpSync(resolve(__dirname, '_locales'), resolve(dist, '_locales'), {
          recursive: true,
        })
        cpSync(resolve(__dirname, 'icons'), resolve(dist, 'icons'), {
          recursive: true,
        })
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyDirBeforeWrite: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        'background/service-worker': resolve(
          __dirname,
          'src/background/service-worker.ts',
        ),
        'content/content-script': resolve(
          __dirname,
          'src/content/content-script.ts',
        ),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (
            chunkInfo.name.includes('service-worker') ||
            chunkInfo.name.includes('content-script')
          ) {
            return '[name].js'
          }
          return 'assets/[name]-[hash].js'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@ext': resolve(__dirname, 'src'),
      '@hchat/shared': resolve(__dirname, '../shared'),
    },
  },
})
