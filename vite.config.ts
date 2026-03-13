import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { bedrockProxy } from './src/server/bedrock-plugin'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/hchat-desktop/' : '/',
  plugins: [
    react(),
    bedrockProxy(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg', 'icons/*.png'],
      manifest: {
        name: 'H Chat Desktop',
        short_name: 'H Chat',
        description: 'AI Chat Interface for AWS Bedrock',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core framework
            if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) {
              return 'vendor-react'
            }
            // Markdown rendering
            if (
              id.includes('react-markdown') ||
              id.includes('remark-') ||
              id.includes('rehype-') ||
              id.includes('unified') ||
              id.includes('mdast') ||
              id.includes('hast') ||
              id.includes('micromark')
            ) {
              return 'vendor-markdown'
            }
            // Syntax highlighting (Prism + all language defs)
            if (
              id.includes('react-syntax-highlighter') ||
              id.includes('refractor') ||
              id.includes('prismjs') ||
              id.includes('prism-') ||
              id.includes('highlight.js')
            ) {
              return 'vendor-syntax'
            }
            // Icons (separate for long-term caching)
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            // State management + persistence
            if (id.includes('zustand') || id.includes('dexie')) {
              return 'vendor-state'
            }
            // Map rendering (lazy-loaded)
            if (id.includes('maplibre-gl')) {
              return 'vendor-maplibre'
            }
          }
        },
      },
    },
  },
})
