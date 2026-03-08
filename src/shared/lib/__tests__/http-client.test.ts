import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHttpClient } from '../http-client'

describe('http-client', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('GET sends request', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    const client = createHttpClient()
    const res = await client.get('/api/test')
    expect(res.data).toEqual({ ok: true })
    expect(res.status).toBe(200)
  })

  it('POST sends body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 201 }))
    const client = createHttpClient()
    const res = await client.post('/api/items', { name: 'test' })
    expect(res.data).toEqual({ id: 1 })
  })

  it('adds default headers', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    const client = createHttpClient('', { Authorization: 'Bearer token' })
    await client.get('/api')
    expect(fetchSpy.mock.calls[0][1]?.headers).toHaveProperty('Authorization', 'Bearer token')
  })

  it('throws on non-ok status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404, statusText: 'Not Found' }))
    const client = createHttpClient()
    await expect(client.get('/missing')).rejects.toThrow('HTTP 404')
  })

  it('supports base URL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    const client = createHttpClient('https://api.example.com')
    await client.get('/users')
    expect(fetchSpy.mock.calls[0][0]).toBe('https://api.example.com/users')
  })

  it('PUT sends body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    const client = createHttpClient()
    await expect(client.put('/api/1', { name: 'updated' })).resolves.toBeDefined()
  })

  it('DELETE sends request', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    const client = createHttpClient()
    await expect(client.delete('/api/1')).resolves.toBeDefined()
  })
})
