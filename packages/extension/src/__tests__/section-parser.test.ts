/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { parseSections, extractTables, extractLists, extractLinks } from '../content/section-parser'

function createElement(html: string): Element {
  const div = document.createElement('div')
  div.innerHTML = html
  return div
}

describe('parseSections', () => {
  it('returns single section for text without headings', () => {
    const el = createElement('<p>Hello world</p>')
    const sections = parseSections(el)
    expect(sections).toHaveLength(1)
    expect(sections[0].level).toBe(0)
    expect(sections[0].content).toContain('Hello world')
  })

  it('parses flat heading structure', () => {
    const el = createElement(`
      <h2>Section A</h2>
      <p>Content A</p>
      <h2>Section B</h2>
      <p>Content B</p>
    `)
    const sections = parseSections(el)
    expect(sections).toHaveLength(2)
    expect(sections[0].heading).toBe('Section A')
    expect(sections[0].content).toContain('Content A')
    expect(sections[1].heading).toBe('Section B')
  })

  it('builds nested tree from heading hierarchy', () => {
    const el = createElement(`
      <h1>Title</h1>
      <p>Intro</p>
      <h2>Sub 1</h2>
      <p>Sub content</p>
      <h2>Sub 2</h2>
      <p>More content</p>
    `)
    const sections = parseSections(el)
    expect(sections).toHaveLength(1)
    expect(sections[0].heading).toBe('Title')
    expect(sections[0].children).toHaveLength(2)
    expect(sections[0].children[0].heading).toBe('Sub 1')
  })

  it('returns empty for empty element', () => {
    const el = createElement('')
    const sections = parseSections(el)
    expect(sections).toHaveLength(0)
  })
})

describe('extractTables', () => {
  it('extracts a simple table', () => {
    const el = createElement(`
      <table>
        <thead><tr><th>Name</th><th>Age</th></tr></thead>
        <tbody>
          <tr><td>Alice</td><td>30</td></tr>
          <tr><td>Bob</td><td>25</td></tr>
        </tbody>
      </table>
    `)
    const tables = extractTables(el)
    expect(tables).toHaveLength(1)
    expect(tables[0].headers).toEqual(['Name', 'Age'])
    expect(tables[0].rows).toHaveLength(2)
    expect(tables[0].rows[0]).toEqual(['Alice', '30'])
  })

  it('extracts table with caption', () => {
    const el = createElement(`
      <table>
        <caption>User Data</caption>
        <tr><th>ID</th></tr>
        <tr><td>1</td></tr>
      </table>
    `)
    const tables = extractTables(el)
    expect(tables).toHaveLength(1)
    expect(tables[0].caption).toBe('User Data')
  })

  it('skips empty tables', () => {
    const el = createElement('<table><tr><th>Header</th></tr></table>')
    const tables = extractTables(el)
    expect(tables).toHaveLength(0)
  })
})

describe('extractLists', () => {
  it('extracts unordered list', () => {
    const el = createElement(`
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
    `)
    const lists = extractLists(el)
    expect(lists).toHaveLength(1)
    expect(lists[0].type).toBe('unordered')
    expect(lists[0].items).toEqual(['Item 1', 'Item 2', 'Item 3'])
  })

  it('extracts ordered list', () => {
    const el = createElement(`
      <ol>
        <li>Step 1</li>
        <li>Step 2</li>
      </ol>
    `)
    const lists = extractLists(el)
    expect(lists).toHaveLength(1)
    expect(lists[0].type).toBe('ordered')
  })

  it('skips navigation lists', () => {
    const el = createElement(`
      <nav>
        <ul><li>Home</li><li>About</li></ul>
      </nav>
    `)
    const lists = extractLists(el)
    expect(lists).toHaveLength(0)
  })

  it('skips single-item lists', () => {
    const el = createElement('<ul><li>Only one</li></ul>')
    const lists = extractLists(el)
    expect(lists).toHaveLength(0)
  })
})

describe('extractLinks', () => {
  it('extracts links with text', () => {
    const el = createElement(`
      <a href="https://example.com">Example</a>
      <a href="/about">About</a>
    `)
    const links = extractLinks(el)
    expect(links).toHaveLength(2)
    expect(links[0].text).toBe('Example')
  })

  it('deduplicates links by href', () => {
    const el = createElement(`
      <a href="https://example.com">Link 1</a>
      <a href="https://example.com">Link 2</a>
    `)
    const links = extractLinks(el)
    expect(links).toHaveLength(1)
  })

  it('skips javascript: links', () => {
    const el = createElement('<a href="javascript:void(0)">Click</a>')
    const links = extractLinks(el)
    expect(links).toHaveLength(0)
  })

  it('skips links without text', () => {
    const el = createElement('<a href="https://example.com"></a>')
    const links = extractLinks(el)
    expect(links).toHaveLength(0)
  })
})
