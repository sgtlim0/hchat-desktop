import { create } from 'zustand'
import type { ApiRequest, ApiResponse, ApiCollection, HttpMethod } from '@/shared/types'
import {
  getAllApiRequests,
  putApiRequest,
  deleteApiRequestFromDb,
  getAllApiCollections,
  putApiCollection,
  deleteApiCollectionFromDb,
} from '@/shared/lib/db'

interface ApiTesterState {
  requests: ApiRequest[]
  collections: ApiCollection[]
  selectedRequestId: string | null
  lastResponse: ApiResponse | null
  isLoading: boolean

  hydrate: () => void
  addRequest: () => void
  updateRequest: (id: string, updates: Partial<ApiRequest>) => void
  deleteRequest: (id: string) => void
  selectRequest: (id: string | null) => void
  setResponse: (response: ApiResponse | null) => void
  setLoading: (loading: boolean) => void
  addCollection: (name: string, description: string) => void
  deleteCollection: (id: string) => void
  getSelectedRequest: () => ApiRequest | undefined
}

export const useApiTesterStore = create<ApiTesterState>((set, get) => ({
  requests: [],
  collections: [],
  selectedRequestId: null,
  lastResponse: null,
  isLoading: false,

  hydrate: () => {
    Promise.all([getAllApiRequests(), getAllApiCollections()])
      .then(([requests, collections]) => set({ requests, collections }))
      .catch(() => {})
  },

  addRequest: () => {
    const now = new Date().toISOString()
    const request: ApiRequest = {
      id: `req-${Date.now()}`,
      name: 'New Request',
      method: 'GET' as HttpMethod,
      url: '',
      headers: [],
      body: '',
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      requests: [request, ...state.requests],
      selectedRequestId: request.id,
    }))

    putApiRequest(request).catch(() => {})
  },

  updateRequest: (id, updates) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id
          ? { ...r, ...updates, updatedAt: new Date().toISOString() }
          : r
      ),
    }))

    const updated = get().requests.find((r) => r.id === id)
    if (updated) putApiRequest(updated).catch(() => {})
  },

  deleteRequest: (id) => {
    set((state) => ({
      requests: state.requests.filter((r) => r.id !== id),
      selectedRequestId: state.selectedRequestId === id ? null : state.selectedRequestId,
      lastResponse: state.selectedRequestId === id ? null : state.lastResponse,
    }))

    deleteApiRequestFromDb(id).catch(() => {})
  },

  selectRequest: (id) => {
    set({ selectedRequestId: id, lastResponse: null })
  },

  setResponse: (response) => {
    set({ lastResponse: response })
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  addCollection: (name, description) => {
    const collection: ApiCollection = {
      id: `col-${Date.now()}`,
      name,
      description,
      requestIds: [],
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      collections: [collection, ...state.collections],
    }))

    putApiCollection(collection).catch(() => {})
  },

  deleteCollection: (id) => {
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
    }))

    deleteApiCollectionFromDb(id).catch(() => {})
  },

  getSelectedRequest: () => {
    const { requests, selectedRequestId } = get()
    return requests.find((r) => r.id === selectedRequestId)
  },
}))
