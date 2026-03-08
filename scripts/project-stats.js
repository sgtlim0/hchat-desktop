#!/usr/bin/env node
/**
 * Project statistics generator.
 * Usage: node scripts/project-stats.js
 */
import { readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const SRC = join(process.cwd(), 'src')

function walk(dir, ext) {
  let files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walk(full, ext))
    else if (!ext || ext.includes(extname(entry.name))) files.push(full)
  }
  return files
}

function countLines(file) {
  const { readFileSync } = require ? await import('fs') : { readFileSync: () => '' }
  try { return readFileSync(file, 'utf-8').split('\n').length } catch { return 0 }
}

const tsFiles = walk(SRC, ['.ts', '.tsx'])
const testFiles = tsFiles.filter(f => f.includes('.test.'))
const hookFiles = walk(join(SRC, 'shared/hooks'), ['.ts']).filter(f => !f.includes('test') && !f.includes('index'))
const libFiles = walk(join(SRC, 'shared/lib'), ['.ts']).filter(f => !f.includes('test') && !f.includes('index') && !f.includes('demo') && !f.includes('example') && !f.includes('README'))
const entityDirs = readdirSync(join(SRC, 'entities'), { withFileTypes: true }).filter(d => d.isDirectory())
const pageDirs = readdirSync(join(SRC, 'pages'), { withFileTypes: true }).filter(d => d.isDirectory())
const e2eFiles = walk(join(process.cwd(), 'e2e'), ['.ts'])

console.log('# H Chat PWA - Project Statistics')
console.log(`Generated: ${new Date().toISOString()}\n`)
console.log(`| Metric | Count |`)
console.log(`|--------|-------|`)
console.log(`| TS/TSX Files | ${tsFiles.length} |`)
console.log(`| Test Files | ${testFiles.length} |`)
console.log(`| Custom Hooks | ${hookFiles.length} |`)
console.log(`| Lib Modules | ${libFiles.length} |`)
console.log(`| Entities (Stores) | ${entityDirs.length} |`)
console.log(`| Pages | ${pageDirs.length} |`)
console.log(`| E2E Specs | ${e2eFiles.length} |`)
