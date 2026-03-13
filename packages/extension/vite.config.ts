import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs'

function copyDirSync(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = resolve(src, entry.name)
    const destPath = resolve(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

function copyStaticPlugin() {
  return {
    name: 'copy-static',
    writeBundle() {
      const outDir = resolve(__dirname, 'dist')
      copyFileSync(resolve(__dirname, 'manifest.json'), resolve(outDir, 'manifest.json'))
      if (existsSync(resolve(__dirname, 'icons'))) {
        copyDirSync(resolve(__dirname, 'icons'), resolve(outDir, 'icons'))
      }
      if (existsSync(resolve(__dirname, '_locales'))) {
        copyDirSync(resolve(__dirname, '_locales'), resolve(outDir, '_locales'))
      }
    },
  }
}

function buildIIFEPlugin(name: string, entry: string) {
  return {
    name: `build-${name}`,
    async writeBundle() {
      const { build } = await import('vite')
      await build({
        configFile: false,
        build: {
          outDir: resolve(__dirname, `dist/${name}`),
          emptyOutDir: false,
          lib: {
            entry,
            formats: ['iife' as const],
            name,
            fileName: () => `${name}.js`,
          },
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
        },
        resolve: {
          alias: {
            '@': resolve(__dirname, 'src'),
          },
        },
      })
    },
  }
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'sidepanel/index': resolve(__dirname, 'src/sidepanel/index.html'),
        'popup/index': resolve(__dirname, 'src/popup/index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  plugins: [
    copyStaticPlugin(),
    buildIIFEPlugin('background', resolve(__dirname, 'src/background/service-worker.ts')),
    buildIIFEPlugin('content', resolve(__dirname, 'src/content/content-script.ts')),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
