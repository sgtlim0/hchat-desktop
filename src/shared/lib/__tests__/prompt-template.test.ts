import { describe, it, expect } from 'vitest'
import { extractVariables, fillTemplate } from '../prompt-template'

describe('extractVariables', () => {
  it('returns empty array for no variables', () => {
    expect(extractVariables('Hello world')).toEqual([])
  })

  it('extracts single variable', () => {
    expect(extractVariables('Hello {{name}}')).toEqual(['name'])
  })

  it('extracts multiple variables', () => {
    expect(extractVariables('{{greeting}} {{name}}, your role is {{role}}')).toEqual([
      'greeting',
      'name',
      'role',
    ])
  })

  it('deduplicates repeated variables', () => {
    expect(extractVariables('{{name}} and {{name}} again')).toEqual(['name'])
  })

  it('handles empty string', () => {
    expect(extractVariables('')).toEqual([])
  })

  it('ignores malformed variables', () => {
    expect(extractVariables('{{}} {{ name}} {{name }} {name}')).toEqual([])
  })
})

describe('fillTemplate', () => {
  it('replaces variables with values', () => {
    expect(fillTemplate('Hello {{name}}', { name: 'World' })).toBe('Hello World')
  })

  it('replaces multiple variables', () => {
    const result = fillTemplate('{{greeting}} {{name}}!', {
      greeting: 'Hi',
      name: 'Alice',
    })
    expect(result).toBe('Hi Alice!')
  })

  it('keeps unmatched variables as-is', () => {
    expect(fillTemplate('Hello {{name}}, age: {{age}}', { name: 'Bob' })).toBe(
      'Hello Bob, age: {{age}}',
    )
  })

  it('handles no variables in template', () => {
    expect(fillTemplate('Hello world', { name: 'Bob' })).toBe('Hello world')
  })

  it('handles empty values', () => {
    expect(fillTemplate('Hello {{name}}', { name: '' })).toBe('Hello ')
  })

  it('replaces all occurrences of same variable', () => {
    expect(fillTemplate('{{x}} + {{x}} = 2{{x}}', { x: '1' })).toBe('1 + 1 = 21')
  })
})
