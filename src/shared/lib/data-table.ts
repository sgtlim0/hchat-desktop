export interface SortConfig<T> {
  key: keyof T
  direction: 'asc' | 'desc'
}

export interface PaginationConfig {
  page: number
  pageSize: number
}

export interface PageInfo {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface DataView<T> {
  items: T[]
  pageInfo: PageInfo
}

export function sortData<T>(data: T[], config: SortConfig<T>): T[] {
  return [...data].sort((a, b) => {
    const aVal = a[config.key]
    const bVal = b[config.key]
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return config.direction === 'desc' ? -cmp : cmp
  })
}

export function filterData<T>(data: T[], predicate: (item: T) => boolean): T[] {
  return data.filter(predicate)
}

export function paginate<T>(
  data: T[],
  config: PaginationConfig,
): { items: T[]; pageInfo: PageInfo } {
  const totalItems = data.length
  const totalPages = Math.max(1, Math.ceil(totalItems / config.pageSize))
  const start = (config.page - 1) * config.pageSize

  // Return empty items if page is out of range
  const items = config.page > totalPages || config.page < 1
    ? []
    : data.slice(start, start + config.pageSize)

  return {
    items,
    pageInfo: {
      page: config.page,
      pageSize: config.pageSize,
      totalItems,
      totalPages,
      hasNext: config.page < totalPages,
      hasPrev: config.page > 1,
    },
  }
}

export function createDataView<T>(
  data: T[],
  options: {
    sort?: SortConfig<T>
    filter?: (item: T) => boolean
    pagination?: PaginationConfig
  },
): DataView<T> {
  let processed = [...data]
  if (options.filter) processed = filterData(processed, options.filter)
  if (options.sort) processed = sortData(processed, options.sort)
  const pag = options.pagination ?? { page: 1, pageSize: processed.length || 1 }
  const { items, pageInfo } = paginate(processed, pag)
  return { items, pageInfo }
}
