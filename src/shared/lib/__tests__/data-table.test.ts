import { describe, it, expect } from 'vitest'
import { sortData, filterData, paginate, createDataView } from '../data-table'

const data = [
  { id: 1, name: 'Charlie', age: 30 },
  { id: 2, name: 'Alice', age: 25 },
  { id: 3, name: 'Bob', age: 35 },
]

describe('data-table', () => {
  describe('sortData', () => {
    it('sorts ascending', () => {
      const r = sortData(data, { key: 'name', direction: 'asc' })
      expect(r[0].name).toBe('Alice')
    })
    it('sorts descending', () => {
      const r = sortData(data, { key: 'age', direction: 'desc' })
      expect(r[0].age).toBe(35)
    })
    it('immutable', () => {
      sortData(data, { key: 'name', direction: 'asc' })
      expect(data[0].name).toBe('Charlie')
    })
  })

  describe('filterData', () => {
    it('filters by predicate', () => {
      const r = filterData(data, (d) => d.age >= 30)
      expect(r).toHaveLength(2)
    })
    it('returns all when always true', () => {
      expect(filterData(data, () => true)).toHaveLength(3)
    })
  })

  describe('paginate', () => {
    it('returns correct page', () => {
      const r = paginate(data, { page: 1, pageSize: 2 })
      expect(r.items).toHaveLength(2)
      expect(r.pageInfo.totalPages).toBe(2)
    })
    it('calculates hasNext/hasPrev', () => {
      const r = paginate(data, { page: 1, pageSize: 2 })
      expect(r.pageInfo.hasNext).toBe(true)
      expect(r.pageInfo.hasPrev).toBe(false)
    })
    it('last page', () => {
      const r = paginate(data, { page: 2, pageSize: 2 })
      expect(r.items).toHaveLength(1)
      expect(r.pageInfo.hasNext).toBe(false)
      expect(r.pageInfo.hasPrev).toBe(true)
    })
  })

  describe('createDataView', () => {
    it('combines sort + filter + paginate', () => {
      const view = createDataView(data, {
        sort: { key: 'age', direction: 'asc' },
        filter: (d) => d.age >= 25,
        pagination: { page: 1, pageSize: 2 },
      })
      expect(view.items).toHaveLength(2)
      expect(view.items[0].name).toBe('Alice')
      expect(view.pageInfo.totalItems).toBe(3)
    })
  })
})
