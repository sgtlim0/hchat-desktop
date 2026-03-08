import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HttpClient, createHttpClient } from '../http-client'

describe('HttpClient', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('get', () => {
    it('sends GET request', async () => {
      const mockResponse = new Response(JSON.stringify({ test: 'data' }), { status: 200 })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const client = new HttpClient()
      const result = await client.get('/api/test')

      expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'GET'
      }))
      expect(result.data).toEqual({ test: 'data' })
      expect(result.status).toBe(200)
    })

    it('handles JSON response', async () => {
      const responseData = { id: 1, name: 'Test' }
      const mockResponse = new Response(JSON.stringify(responseData), { status: 200 })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const client = new HttpClient()
      const result = await client.get<typeof responseData>('/api/users/1')

      expect(result.data).toEqual(responseData)
    })
  })

  describe('post', () => {
    it('sends POST with body', async () => {
      const requestBody = { name: 'John', age: 30 }
      const mockResponse = new Response(JSON.stringify({ id: 1, ...requestBody }), { status: 201 })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const client = new HttpClient()
      const result = await client.post('/api/users', requestBody)

      expect(fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      }))
      expect(result.status).toBe(201)
    })
  })

  describe('headers', () => {
    it('adds default headers', async () => {
      const mockResponse = new Response('{}', { status: 200 })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const defaultHeaders = { 'X-API-Key': 'secret123' }
      const client = new HttpClient(undefined, defaultHeaders)
      await client.get('/api/test')

      expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        headers: expect.objectContaining(defaultHeaders)
      }))
    })
  })

  describe('error handling', () => {
    it('throws on non-ok status', async () => {
      const mockResponse = new Response('Not Found', { status: 404, statusText: 'Not Found' })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const client = new HttpClient()
      await expect(client.get('/api/missing')).rejects.toThrow('HTTP error! status: 404')
    })
  })

  describe('timeout', () => {
    it('supports custom timeout via AbortController', async () => {
      // Create a promise that never resolves to simulate a hanging request
      vi.mocked(fetch).mockImplementation(
        (url, options) =>
          new Promise((resolve, reject) => {
            // Listen for abort signal
            const signal = (options as any)?.signal
            if (signal) {
              signal.addEventListener('abort', () => {
                const error = new Error('The operation was aborted')
                error.name = 'AbortError'
                reject(error)
              })
            }
            // Never resolve - simulating a slow/hanging request
          })
      )

      const client = new HttpClient()
      await expect(client.get('/api/slow', { timeout: 50 })).rejects.toThrow('Request aborted')
    })
  })

  describe('base URL', () => {
    it('supports base URL', async () => {
      const mockResponse = new Response('{}', { status: 200 })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const client = new HttpClient('https://api.example.com')
      await client.get('/users')

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/users', expect.any(Object))
    })
  })

  describe('createHttpClient', () => {
    it('returns configured instance', async () => {
      const mockResponse = new Response(JSON.stringify({ configured: true }), { status: 200 })
      vi.mocked(fetch).mockResolvedValue(mockResponse)

      const client = createHttpClient('https://api.test.com', { 'X-API-Key': 'test123' })
      const result = await client.get('/endpoint')

      expect(fetch).toHaveBeenCalledWith('https://api.test.com/endpoint', expect.objectContaining({
        headers: expect.objectContaining({
          'X-API-Key': 'test123'
        })
      }))
      expect(result.data).toEqual({ configured: true })
    })
  })
})
