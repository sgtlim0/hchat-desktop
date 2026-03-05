import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useApiTesterStore } from '../api-tester.store'
import type { ApiRequest, ApiCollection } from '@/shared/types'

// Mock the db module
vi.mock('@/shared/lib/db', () => ({
  getAllApiRequests: vi.fn(() => Promise.resolve([])),
  putApiRequest: vi.fn(() => Promise.resolve()),
  deleteApiRequestFromDb: vi.fn(() => Promise.resolve()),
  getAllApiCollections: vi.fn(() => Promise.resolve([])),
  putApiCollection: vi.fn(() => Promise.resolve()),
  deleteApiCollectionFromDb: vi.fn(() => Promise.resolve()),
}))

describe('ApiTesterStore', () => {
  beforeEach(() => {
    useApiTesterStore.setState({
      requests: [],
      collections: [],
      selectedRequestId: null,
      lastResponse: null,
      isLoading: false,
    })
  })

  it('should add a new request', () => {
    const { addRequest } = useApiTesterStore.getState()

    addRequest()

    const { requests, selectedRequestId } = useApiTesterStore.getState()
    expect(requests).toHaveLength(1)
    expect(requests[0].name).toBe('New Request')
    expect(requests[0].method).toBe('GET')
    expect(requests[0].url).toBe('')
    expect(requests[0].headers).toEqual([])
    expect(selectedRequestId).toBe(requests[0].id)
  })

  it('should update a request', () => {
    const { addRequest, updateRequest } = useApiTesterStore.getState()

    addRequest()
    const reqId = useApiTesterStore.getState().requests[0].id

    updateRequest(reqId, { name: 'Updated', method: 'POST', url: 'https://api.example.com' })

    const updated = useApiTesterStore.getState().requests[0]
    expect(updated.name).toBe('Updated')
    expect(updated.method).toBe('POST')
    expect(updated.url).toBe('https://api.example.com')
  })

  it('should delete a request', () => {
    const { addRequest, deleteRequest, selectRequest } = useApiTesterStore.getState()

    addRequest()

    // Add a second request with a slight delay to avoid ID collision
    const firstId = useApiTesterStore.getState().requests[0].id
    selectRequest(firstId)

    deleteRequest(firstId)

    const state = useApiTesterStore.getState()
    expect(state.requests).toHaveLength(0)
    expect(state.selectedRequestId).toBeNull()
    expect(state.lastResponse).toBeNull()
  })

  it('should select a request', () => {
    const { addRequest, selectRequest } = useApiTesterStore.getState()

    addRequest()
    const reqId = useApiTesterStore.getState().requests[0].id

    selectRequest(null)
    expect(useApiTesterStore.getState().selectedRequestId).toBeNull()

    selectRequest(reqId)
    expect(useApiTesterStore.getState().selectedRequestId).toBe(reqId)
  })

  it('should set response', () => {
    const { setResponse } = useApiTesterStore.getState()

    const response = {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      body: '{"ok":true}',
      duration: 150,
      size: 11,
      timestamp: '2026-01-01T00:00:00Z',
    }

    setResponse(response)
    expect(useApiTesterStore.getState().lastResponse).toEqual(response)

    setResponse(null)
    expect(useApiTesterStore.getState().lastResponse).toBeNull()
  })

  it('should set loading state', () => {
    const { setLoading } = useApiTesterStore.getState()

    setLoading(true)
    expect(useApiTesterStore.getState().isLoading).toBe(true)

    setLoading(false)
    expect(useApiTesterStore.getState().isLoading).toBe(false)
  })

  it('should add a collection', () => {
    const { addCollection } = useApiTesterStore.getState()

    addCollection('My Collection', 'A test collection')

    const { collections } = useApiTesterStore.getState()
    expect(collections).toHaveLength(1)
    expect(collections[0].name).toBe('My Collection')
    expect(collections[0].description).toBe('A test collection')
    expect(collections[0].requestIds).toEqual([])
  })

  it('should delete a collection', () => {
    // Manually set collections to avoid Date.now() collision
    const col1 = {
      id: 'col-100',
      name: 'Collection 1',
      description: 'First',
      requestIds: [],
      createdAt: '2026-01-01T00:00:00Z',
    }
    const col2 = {
      id: 'col-200',
      name: 'Collection 2',
      description: 'Second',
      requestIds: [],
      createdAt: '2026-01-02T00:00:00Z',
    }

    useApiTesterStore.setState({ collections: [col1, col2] })

    const { deleteCollection } = useApiTesterStore.getState()
    deleteCollection('col-200')

    const { collections } = useApiTesterStore.getState()
    expect(collections).toHaveLength(1)
    expect(collections[0].name).toBe('Collection 1')
  })

  it('should get selected request', () => {
    const { addRequest, getSelectedRequest } = useApiTesterStore.getState()

    expect(getSelectedRequest()).toBeUndefined()

    addRequest()

    const selected = useApiTesterStore.getState().getSelectedRequest()
    expect(selected).toBeDefined()
    expect(selected?.name).toBe('New Request')
  })

  it('should hydrate from database', async () => {
    const mockRequests: ApiRequest[] = [
      {
        id: 'req-1',
        name: 'Saved Request',
        method: 'POST',
        url: 'https://api.example.com',
        headers: [{ key: 'Authorization', value: 'Bearer token', enabled: true }],
        body: '{"data":1}',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]

    const mockCollections: ApiCollection[] = [
      {
        id: 'col-1',
        name: 'Saved Collection',
        description: 'Test',
        requestIds: ['req-1'],
        createdAt: '2026-01-01T00:00:00Z',
      },
    ]

    const { getAllApiRequests, getAllApiCollections } = await import('@/shared/lib/db')
    vi.mocked(getAllApiRequests).mockResolvedValueOnce(mockRequests)
    vi.mocked(getAllApiCollections).mockResolvedValueOnce(mockCollections)

    useApiTesterStore.getState().hydrate()

    await new Promise((resolve) => setTimeout(resolve, 10))

    const state = useApiTesterStore.getState()
    expect(state.requests).toEqual(mockRequests)
    expect(state.collections).toEqual(mockCollections)
  })

  it('should clear response when selecting a different request', () => {
    const { addRequest, setResponse, selectRequest } = useApiTesterStore.getState()

    addRequest()

    setResponse({
      status: 200,
      statusText: 'OK',
      headers: {},
      body: '{}',
      duration: 100,
      size: 2,
      timestamp: '2026-01-01T00:00:00Z',
    })

    expect(useApiTesterStore.getState().lastResponse).not.toBeNull()

    selectRequest('some-other-id')
    expect(useApiTesterStore.getState().lastResponse).toBeNull()
  })
})
