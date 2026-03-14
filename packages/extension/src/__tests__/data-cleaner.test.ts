import { describe, it, expect } from 'vitest'
import {
  cleanTable,
  tableToRecords,
  computeColumnStats,
} from '../content/data-cleaner'

describe('cleanTable', () => {
  it('infers numeric column types', () => {
    const result = cleanTable(
      ['Name', 'Age', 'Score'],
      [
        ['Alice', '30', '95.5'],
        ['Bob', '25', '88.0'],
      ],
    )
    expect(result.columnTypes).toEqual(['string', 'number', 'number'])
  })

  it('infers percentage type', () => {
    const result = cleanTable(['Name', 'Rate'], [['A', '85%'], ['B', '90%']])
    expect(result.columnTypes[1]).toBe('percentage')
  })

  it('infers currency type', () => {
    const result = cleanTable(['Item', 'Price'], [['Widget', '$12.99'], ['Gadget', '$24.50']])
    expect(result.columnTypes[1]).toBe('currency')
  })

  it('parses numeric values correctly', () => {
    const result = cleanTable(['Value'], [['1,234.56'], ['7,890']])
    expect(result.rows[0][0].value).toBe(1234.56)
    expect(result.rows[1][0].value).toBe(7890)
  })

  it('handles empty and null values', () => {
    const result = cleanTable(['Col'], [[''], ['-'], ['N/A'], ['value']])
    expect(result.rows[0][0].type).toBe('string')
    expect(result.rows[3][0].value).toBe('value')
  })

  it('trims header whitespace', () => {
    const result = cleanTable(['  Name  ', ' Age '], [['A', '1']])
    expect(result.headers).toEqual(['Name', 'Age'])
  })

  it('preserves caption', () => {
    const result = cleanTable(['A'], [['1']], 'My Table')
    expect(result.caption).toBe('My Table')
  })
})

describe('tableToRecords', () => {
  it('converts to array of objects', () => {
    const table = cleanTable(['Name', 'Age'], [['Alice', '30'], ['Bob', '25']])
    const records = tableToRecords(table)
    expect(records).toHaveLength(2)
    expect(records[0]).toEqual({ Name: 'Alice', Age: 30 })
    expect(records[1]).toEqual({ Name: 'Bob', Age: 25 })
  })

  it('uses col_N for missing headers', () => {
    const table = cleanTable([], [['a', 'b']])
    const records = tableToRecords(table)
    expect(records[0]).toEqual({})
  })
})

describe('computeColumnStats', () => {
  it('computes stats for numeric columns', () => {
    const table = cleanTable(
      ['Name', 'Score'],
      [
        ['Alice', '90'],
        ['Bob', '80'],
        ['Carol', '100'],
      ],
    )
    const stats = computeColumnStats(table)

    const scoreStats = stats.find((s) => s.column === 'Score')!
    expect(scoreStats.min).toBe(80)
    expect(scoreStats.max).toBe(100)
    expect(scoreStats.mean).toBe(90)
    expect(scoreStats.sum).toBe(270)
    expect(scoreStats.count).toBe(3)
  })

  it('counts nulls correctly', () => {
    const table = cleanTable(['Val'], [['10'], [''], ['-'], ['20']])
    const stats = computeColumnStats(table)
    expect(stats[0].nullCount).toBe(2)
  })

  it('handles string-only columns', () => {
    const table = cleanTable(['Name'], [['Alice'], ['Bob']])
    const stats = computeColumnStats(table)
    expect(stats[0].type).toBe('string')
    expect(stats[0].min).toBeUndefined()
  })
})
