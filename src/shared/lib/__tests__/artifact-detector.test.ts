import { describe, it, expect } from 'vitest'
import { detectArtifacts, inferArtifactTitle, languageToArtifactType } from '../artifact-detector'

describe('languageToArtifactType', () => {
  it('maps html/htm to html type', () => {
    expect(languageToArtifactType('html')).toBe('html')
    expect(languageToArtifactType('htm')).toBe('html')
  })

  it('maps svg to svg type', () => {
    expect(languageToArtifactType('svg')).toBe('svg')
  })

  it('maps mermaid to mermaid type', () => {
    expect(languageToArtifactType('mermaid')).toBe('mermaid')
  })

  it('maps unknown languages to code', () => {
    expect(languageToArtifactType('javascript')).toBe('code')
    expect(languageToArtifactType('python')).toBe('code')
    expect(languageToArtifactType('typescript')).toBe('code')
  })

  it('is case-insensitive', () => {
    expect(languageToArtifactType('HTML')).toBe('html')
    expect(languageToArtifactType('SVG')).toBe('svg')
  })
})

describe('inferArtifactTitle', () => {
  it('extracts function name', () => {
    expect(inferArtifactTitle('javascript', 'function greet() { return "hi" }'))
      .toBe('greet')
  })

  it('extracts const function name', () => {
    expect(inferArtifactTitle('typescript', 'const fetchData = async () => {}'))
      .toBe('fetchData')
  })

  it('extracts class name', () => {
    expect(inferArtifactTitle('java', 'class UserService {\n  constructor() {}\n}'))
      .toBe('UserService')
  })

  it('extracts export default function name', () => {
    expect(inferArtifactTitle('typescript', 'export default function App() { return null }'))
      .toBe('App')
  })

  it('extracts HTML title', () => {
    expect(inferArtifactTitle('html', '<html><head><title>My Page</title></head></html>'))
      .toBe('My Page')
  })

  it('extracts mermaid diagram type', () => {
    expect(inferArtifactTitle('mermaid', 'flowchart TD\n  A --> B'))
      .toBe('flowchart diagram')
  })

  it('falls back to language snippet', () => {
    expect(inferArtifactTitle('css', 'body { margin: 0 }'))
      .toBe('css snippet')
  })
})

describe('detectArtifacts', () => {
  it('detects code blocks with 5+ lines', () => {
    const md = '```javascript\nconst a = 1\nconst b = 2\nconst c = 3\nconst d = 4\nconst e = 5\n```'
    const result = detectArtifacts(md)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('code')
    expect(result[0].language).toBe('javascript')
  })

  it('skips code blocks with fewer than 5 lines', () => {
    const md = '```javascript\nconst a = 1\nconst b = 2\n```'
    const result = detectArtifacts(md)
    expect(result).toHaveLength(0)
  })

  it('always detects html blocks regardless of line count', () => {
    const md = '```html\n<div>Hello</div>\n```'
    const result = detectArtifacts(md)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('html')
  })

  it('always detects svg blocks', () => {
    const md = '```svg\n<svg width="100"></svg>\n```'
    const result = detectArtifacts(md)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('svg')
  })

  it('always detects mermaid blocks', () => {
    const md = '```mermaid\nflowchart TD\n  A --> B\n```'
    const result = detectArtifacts(md)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('mermaid')
  })

  it('detects multiple code blocks', () => {
    const md = [
      '```html\n<div>Hi</div>\n```',
      'Some text',
      '```mermaid\nflowchart TD\n  A --> B\n```',
    ].join('\n\n')
    const result = detectArtifacts(md)
    expect(result).toHaveLength(2)
    expect(result[0].type).toBe('html')
    expect(result[1].type).toBe('mermaid')
  })

  it('skips empty code blocks', () => {
    const md = '```javascript\n\n```'
    const result = detectArtifacts(md)
    expect(result).toHaveLength(0)
  })

  it('handles blocks without language specifier', () => {
    const md = '```\nline1\nline2\nline3\nline4\nline5\n```'
    const result = detectArtifacts(md)
    expect(result).toHaveLength(1)
    expect(result[0].language).toBe('text')
    expect(result[0].type).toBe('code')
  })
})
