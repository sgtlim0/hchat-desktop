import { describe, it, expect, beforeEach } from 'vitest'
import { useInternalSearchStore } from '../internal-search.store'

describe('InternalSearchStore', () => {
  beforeEach(() => {
    useInternalSearchStore.setState({
      query: '',
      targets: ['confluence', 'jira'],
      results: [],
      summary: '',
      isSearching: false
    })
  })

  it('should have initial state with empty results and not searching', () => {
    const state = useInternalSearchStore.getState()

    expect(state.query).toBe('')
    expect(state.targets).toEqual(['confluence', 'jira'])
    expect(state.results).toEqual([])
    expect(state.summary).toBe('')
    expect(state.isSearching).toBe(false)
  })

  it('should update query with setQuery', () => {
    const { setQuery } = useInternalSearchStore.getState()

    setQuery('search term')

    const state = useInternalSearchStore.getState()
    expect(state.query).toBe('search term')
  })

  it('should update targets array with setTargets', () => {
    const { setTargets } = useInternalSearchStore.getState()

    setTargets(['jira'])

    const state = useInternalSearchStore.getState()
    expect(state.targets).toEqual(['jira'])
  })

  it('should toggle target with toggleTarget', () => {
    const { toggleTarget } = useInternalSearchStore.getState()

    // Remove existing target
    toggleTarget('confluence')
    let state = useInternalSearchStore.getState()
    expect(state.targets).toEqual(['jira'])

    // Add it back
    toggleTarget('confluence')
    state = useInternalSearchStore.getState()
    expect(state.targets).toContain('confluence')
    expect(state.targets).toContain('jira')
  })

  it('should append results with addResults', () => {
    const { addResults } = useInternalSearchStore.getState()

    const newResults = [
      {
        type: 'confluence' as const,
        title: 'Test Page',
        url: 'https://confluence.example.com/page1',
        excerpt: 'Test content',
        space: 'TEAM',
        updated: '2024-01-01'
      },
      {
        type: 'jira' as const,
        title: 'Bug Fix',
        url: 'https://jira.example.com/PROJ-123',
        excerpt: 'Fix critical bug',
        key: 'PROJ-123',
        status: 'In Progress',
        assignee: 'john.doe'
      }
    ]

    addResults(newResults)

    const state = useInternalSearchStore.getState()
    expect(state.results).toHaveLength(2)
    expect(state.results[0].title).toBe('Test Page')
    expect(state.results[1].key).toBe('PROJ-123')
  })

  it('should clear results with clearResults', () => {
    const { addResults, clearResults } = useInternalSearchStore.getState()

    addResults([
      {
        type: 'confluence',
        title: 'Test',
        url: 'https://example.com',
        excerpt: 'Test'
      }
    ])

    clearResults()

    const state = useInternalSearchStore.getState()
    expect(state.results).toEqual([])
  })

  it('should update summary with setSummary', () => {
    const { setSummary } = useInternalSearchStore.getState()

    setSummary('Found 10 results across Confluence and Jira')

    const state = useInternalSearchStore.getState()
    expect(state.summary).toBe('Found 10 results across Confluence and Jira')
  })

  it('should toggle searching state with setSearching', () => {
    const { setSearching } = useInternalSearchStore.getState()

    setSearching(true)
    let state = useInternalSearchStore.getState()
    expect(state.isSearching).toBe(true)

    setSearching(false)
    state = useInternalSearchStore.getState()
    expect(state.isSearching).toBe(false)
  })

  it('should get active targets based on targets array', () => {
    const { setTargets } = useInternalSearchStore.getState()

    // Both targets active by default
    let state = useInternalSearchStore.getState()
    expect(state.targets).toEqual(['confluence', 'jira'])

    // Only Jira active
    setTargets(['jira'])
    state = useInternalSearchStore.getState()
    expect(state.targets).toEqual(['jira'])

    // Only Confluence active
    setTargets(['confluence'])
    state = useInternalSearchStore.getState()
    expect(state.targets).toEqual(['confluence'])

    // No targets active
    setTargets([])
    state = useInternalSearchStore.getState()
    expect(state.targets).toEqual([])
  })

  it('should reset everything with clearAll', () => {
    const { setQuery, addResults, setSummary, setSearching, setTargets, clearAll } = useInternalSearchStore.getState()

    // Set some data
    setQuery('test query')
    setTargets(['jira'])
    addResults([
      {
        type: 'confluence',
        title: 'Test',
        url: 'https://example.com',
        excerpt: 'Test'
      }
    ])
    setSummary('Test summary')
    setSearching(true)

    // Clear all
    clearAll()

    const state = useInternalSearchStore.getState()
    expect(state.query).toBe('')
    expect(state.targets).toEqual(['confluence', 'jira'])
    expect(state.results).toEqual([])
    expect(state.summary).toBe('')
    expect(state.isSearching).toBe(false)
  })

  it('should handle multiple result additions', () => {
    const { addResults } = useInternalSearchStore.getState()

    // Add first batch
    addResults([
      {
        type: 'confluence',
        title: 'Page 1',
        url: 'https://confluence.example.com/page1',
        excerpt: 'Content 1'
      }
    ])

    // Add second batch
    addResults([
      {
        type: 'jira',
        title: 'Issue 1',
        url: 'https://jira.example.com/PROJ-1',
        excerpt: 'Issue content',
        key: 'PROJ-1'
      }
    ])

    const state = useInternalSearchStore.getState()
    expect(state.results).toHaveLength(2)
    expect(state.results[0].title).toBe('Page 1')
    expect(state.results[1].title).toBe('Issue 1')
  })

  it('should preserve other state when updating individual properties', () => {
    const { setQuery, setSummary, setSearching } = useInternalSearchStore.getState()

    setQuery('test')
    setSummary('summary')
    setSearching(true)

    const state = useInternalSearchStore.getState()
    expect(state.query).toBe('test')
    expect(state.summary).toBe('summary')
    expect(state.isSearching).toBe(true)
    expect(state.targets).toEqual(['confluence', 'jira']) // Should remain unchanged
    expect(state.results).toEqual([]) // Should remain unchanged
  })
})