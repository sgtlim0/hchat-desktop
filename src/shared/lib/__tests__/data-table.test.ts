import { describe, it, expect } from 'vitest'
import {
  sortData,
  filterData,
  paginate,
  createDataView,
  type SortConfig,
  type PaginationConfig
} from '../data-table'

interface TestItem {
  id: number
  name: string
  value: number
  active: boolean
}

const testData: TestItem[] = [
  { id: 1, name: 'Alpha', value: 100, active: true },
  { id: 2, name: 'Beta', value: 50, active: false },
  { id: 3, name: 'Charlie', value: 200, active: true },
  { id: 4, name: 'Delta', value: 150, active: false },
  { id: 5, name: 'Echo', value: 75, active: true }
]

describe('sortData', () => {
  it('sorts ascending by key', () => {
    const config: SortConfig<TestItem> = { key: 'value', direction: 'asc' }
    const result = sortData(testData, config)

    expect(result).toHaveLength(5)
    expect(result[0].value).toBe(50)
    expect(result[1].value).toBe(75)
    expect(result[2].value).toBe(100)
    expect(result[3].value).toBe(150)
    expect(result[4].value).toBe(200)
  })

  it('sorts descending', () => {
    const config: SortConfig<TestItem> = { key: 'value', direction: 'desc' }
    const result = sortData(testData, config)

    expect(result).toHaveLength(5)
    expect(result[0].value).toBe(200)
    expect(result[1].value).toBe(150)
    expect(result[2].value).toBe(100)
    expect(result[3].value).toBe(75)
    expect(result[4].value).toBe(50)
  })

  it('handles string comparison', () => {
    const config: SortConfig<TestItem> = { key: 'name', direction: 'asc' }
    const result = sortData(testData, config)

    expect(result[0].name).toBe('Alpha')
    expect(result[1].name).toBe('Beta')
    expect(result[2].name).toBe('Charlie')
    expect(result[3].name).toBe('Delta')
    expect(result[4].name).toBe('Echo')
  })
})

describe('filterData', () => {
  it('filters by predicate', () => {
    const predicate = (item: TestItem) => item.active === true
    const result = filterData(testData, predicate)

    expect(result).toHaveLength(3)
    expect(result.every(item => item.active)).toBe(true)
  })

  it('returns all when no filter', () => {
    const predicate = (item: TestItem) => true
    const result = filterData(testData, predicate)

    expect(result).toHaveLength(5)
    expect(result).toEqual(testData)
  })
})

describe('paginate', () => {
  it('returns correct page', () => {
    const config: PaginationConfig = { page: 1, pageSize: 2 }
    const result = paginate(testData, config)

    expect(result.items).toHaveLength(2)
    expect(result.items[0].id).toBe(1)
    expect(result.items[1].id).toBe(2)
  })

  it('calculates totalPages', () => {
    const config: PaginationConfig = { page: 1, pageSize: 2 }
    const result = paginate(testData, config)

    expect(result.pageInfo.totalPages).toBe(3)
    expect(result.pageInfo.totalItems).toBe(5)
  })

  it('returns empty for out of range', () => {
    const config: PaginationConfig = { page: 10, pageSize: 2 }
    const result = paginate(testData, config)

    expect(result.items).toHaveLength(0)
    expect(result.pageInfo.page).toBe(10)
    expect(result.pageInfo.totalPages).toBe(3)
  })

  it('getPageInfo returns first/last/hasNext/hasPrev', () => {
    const config: PaginationConfig = { page: 2, pageSize: 2 }
    const result = paginate(testData, config)

    expect(result.pageInfo.page).toBe(2)
    expect(result.pageInfo.pageSize).toBe(2)
    expect(result.pageInfo.hasNext).toBe(true)
    expect(result.pageInfo.hasPrev).toBe(true)
  })
})

describe('createDataView', () => {
  it('combines sort + filter + paginate', () => {
    const result = createDataView(testData, {
      sort: { key: 'value', direction: 'desc' },
      filter: item => item.active === true,
      pagination: { page: 1, pageSize: 2 }
    })

    expect(result.items).toHaveLength(2)
    expect(result.items[0].value).toBe(200) // Charlie
    expect(result.items[1].value).toBe(100) // Alpha
    expect(result.pageInfo.totalItems).toBe(3)
  })
})
