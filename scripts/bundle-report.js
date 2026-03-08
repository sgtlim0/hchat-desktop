#!/usr/bin/env node
/**
 * Bundle size report generator.
 * Run after `npm run build` to analyze dist/ output.
 * Usage: node scripts/bundle-report.js
 */
import { readdirSync, statSync, writeFileSync } from 'fs'
import { join, extname } from 'path'

const DIST_DIR = join(process.cwd(), 'dist')
const WARN_TOTAL_KB = 2048
const WARN_CHUNK_KB = 500

function walkDir(dir) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath))
    } else {
      const stat = statSync(fullPath)
      results.push({
        path: fullPath.replace(DIST_DIR + '/', ''),
        size: stat.size,
        ext: extname(entry.name),
      })
    }
  }
  return results
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

try {
  const files = walkDir(DIST_DIR)
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)
  const totalKB = totalSize / 1024

  const byExt = {}
  for (const f of files) {
    byExt[f.ext] = (byExt[f.ext] || 0) + f.size
  }

  const jsFiles = files
    .filter((f) => f.ext === '.js')
    .sort((a, b) => b.size - a.size)

  const warnings = []
  if (totalKB > WARN_TOTAL_KB) {
    warnings.push(`Total bundle ${formatSize(totalSize)} exceeds ${WARN_TOTAL_KB}KB limit`)
  }
  for (const f of jsFiles) {
    if (f.size / 1024 > WARN_CHUNK_KB) {
      warnings.push(`${f.path} (${formatSize(f.size)}) exceeds ${WARN_CHUNK_KB}KB chunk limit`)
    }
  }

  const report = [
    '# Bundle Size Report',
    '',
    `> Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total Size | ${formatSize(totalSize)} |`,
    `| Total Files | ${files.length} |`,
    `| JS Files | ${jsFiles.length} |`,
    '',
    '## By Extension',
    '',
    '| Extension | Size |',
    '|-----------|------|',
    ...Object.entries(byExt)
      .sort(([, a], [, b]) => b - a)
      .map(([ext, size]) => `| ${ext || '(none)'} | ${formatSize(size)} |`),
    '',
    '## Top JS Chunks',
    '',
    '| File | Size |',
    '|------|------|',
    ...jsFiles.slice(0, 10).map((f) => `| ${f.path} | ${formatSize(f.size)} |`),
  ]

  if (warnings.length > 0) {
    report.push('', '## Warnings', '', ...warnings.map((w) => `- ${w}`))
  }

  const reportText = report.join('\n') + '\n'
  writeFileSync(join(process.cwd(), 'dist-report.md'), reportText)
  console.log(reportText)

  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s) found.`)
  } else {
    console.log('\nNo warnings. Bundle sizes are within limits.')
  }
} catch (e) {
  console.error('Error: Run `npm run build` first, then run this script.')
  console.error(e.message)
  process.exit(1)
}
