import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from '../event-emitter'

describe('EventEmitter', () => {
  let emitter: EventEmitter

  beforeEach(() => {
    emitter = new EventEmitter()
  })

  it('calls listener on emit', () => {
    const cb = vi.fn()
    emitter.on('test', cb)
    emitter.emit('test', 'hello')
    expect(cb).toHaveBeenCalledWith('hello')
  })

  it('supports multiple listeners', () => {
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    emitter.on('test', cb1)
    emitter.on('test', cb2)
    emitter.emit('test')
    expect(cb1).toHaveBeenCalled()
    expect(cb2).toHaveBeenCalled()
  })

  it('removes listener with off', () => {
    const cb = vi.fn()
    emitter.on('test', cb)
    emitter.off('test', cb)
    emitter.emit('test')
    expect(cb).not.toHaveBeenCalled()
  })

  it('returns unsubscribe function from on', () => {
    const cb = vi.fn()
    const unsub = emitter.on('test', cb)
    unsub()
    emitter.emit('test')
    expect(cb).not.toHaveBeenCalled()
  })

  it('once fires only once', () => {
    const cb = vi.fn()
    emitter.once('test', cb)
    emitter.emit('test', 'a')
    emitter.emit('test', 'b')
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith('a')
  })

  it('removeAllListeners for specific event', () => {
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    emitter.on('a', cb1)
    emitter.on('b', cb2)
    emitter.removeAllListeners('a')
    emitter.emit('a')
    emitter.emit('b')
    expect(cb1).not.toHaveBeenCalled()
    expect(cb2).toHaveBeenCalled()
  })

  it('removeAllListeners clears all', () => {
    emitter.on('a', vi.fn())
    emitter.on('b', vi.fn())
    emitter.removeAllListeners()
    expect(emitter.listenerCount('a')).toBe(0)
    expect(emitter.listenerCount('b')).toBe(0)
  })

  it('listenerCount returns correct count', () => {
    expect(emitter.listenerCount('test')).toBe(0)
    emitter.on('test', vi.fn())
    emitter.on('test', vi.fn())
    expect(emitter.listenerCount('test')).toBe(2)
  })

  it('emit with no listeners does nothing', () => {
    expect(() => emitter.emit('nonexistent')).not.toThrow()
  })

  it('different events are independent', () => {
    const cbA = vi.fn()
    const cbB = vi.fn()
    emitter.on('a', cbA)
    emitter.on('b', cbB)
    emitter.emit('a', 'data')
    expect(cbA).toHaveBeenCalledWith('data')
    expect(cbB).not.toHaveBeenCalled()
  })

  it('passes typed data correctly', () => {
    const cb = vi.fn()
    emitter.on<{ count: number }>('update', cb)
    emitter.emit('update', { count: 42 })
    expect(cb).toHaveBeenCalledWith({ count: 42 })
  })
})
