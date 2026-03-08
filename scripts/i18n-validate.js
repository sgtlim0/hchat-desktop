#!/usr/bin/env node
/**
 * i18n validation script.
 * Compares ko.ts and en.ts translation files to detect missing keys.
 * Usage: node scripts/i18n-validate.js
 */
import { readFileSync } from 'fs'
import { join } from 'path'

const I18N_DIR = join(process.cwd(), 'src/shared/i18n')

function extractKeys(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const keys = []
  const regex = /['"]([a-zA-Z0-9._]+)['"]\s*:/g
  let match
  while ((match = regex.exec(content)) !== null) {
    keys.push(match[1])
  }
  return new Set(keys)
}

try {
  const koKeys = extractKeys(join(I18N_DIR, 'ko.ts'))
  const enKeys = extractKeys(join(I18N_DIR, 'en.ts'))

  const missingInEn = [...koKeys].filter((k) => !enKeys.has(k))
  const missingInKo = [...enKeys].filter((k) => !koKeys.has(k))

  console.log(`Korean keys: ${koKeys.size}`)
  console.log(`English keys: ${enKeys.size}`)
  console.log()

  if (missingInEn.length > 0) {
    console.log(`Missing in en.ts (${missingInEn.length}):`)
    missingInEn.forEach((k) => console.log(`  - ${k}`))
  }

  if (missingInKo.length > 0) {
    console.log(`Missing in ko.ts (${missingInKo.length}):`)
    missingInKo.forEach((k) => console.log(`  - ${k}`))
  }

  if (missingInEn.length === 0 && missingInKo.length === 0) {
    console.log('All keys match between ko.ts and en.ts.')
  }

  const total = missingInEn.length + missingInKo.length
  if (total > 0) {
    console.log(`\n${total} missing key(s) found.`)
    process.exit(1)
  }
} catch (e) {
  console.error('Error reading i18n files:', e.message)
  process.exit(1)
}
