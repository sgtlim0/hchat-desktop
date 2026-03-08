import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useIntersectionObserver } from '../useIntersectionObserver'

let mockObserverInstance: any
let observerCallback: IntersectionObserverCallback

class MockIntersectionObserver {
  callback: IntersectionObserverCallback
  options?: IntersectionObserverInit
  elements = new Set<Element>()

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback
    this.options = options
    observerCallback = callback
    mockObserverInstance = this
  }

  observe(element: Element) {
    this.elements.add(element)
  }

  unobserve(element: Element) {
    this.elements.delete(element)
  }

  disconnect() {
    this.elements.clear()
  }
}

beforeEach(() => {
  mockObserverInstance = null
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => {
  mockObserverInstance = null
  vi.unstubAllGlobals()
})

describe('useIntersectionObserver', () => {
  it('returns ref and isIntersecting=false initially', () => {
    const { result } = renderHook(() => useIntersectionObserver())

    expect(result.current.ref.current).toBeNull()
    expect(result.current.isIntersecting).toBe(false)
    expect(result.current.entry).toBeNull()
  })

  it('sets isIntersecting when element enters viewport', async () => {
    const { result, rerender } = renderHook(() => useIntersectionObserver())

    // Simulate mounting element
    const element = document.createElement('div')
    Object.defineProperty(result.current.ref, 'current', {
      writable: true,
      value: element
    })

    // Trigger re-render to observe element
    rerender()

    await waitFor(() => {
      expect(mockObserverInstance).toBeDefined()
    })

    // Trigger intersection
    act(() => {
      observerCallback([{
        target: element,
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: 0
      }] as IntersectionObserverEntry[], mockObserverInstance)
    })

    expect(result.current.isIntersecting).toBe(true)
    expect(result.current.entry).not.toBeNull()
    expect(result.current.entry?.isIntersecting).toBe(true)
  })

  it('supports threshold option', async () => {
    const threshold = [0, 0.5, 1]
    const { result, rerender } = renderHook(() => useIntersectionObserver({ threshold }))

    // Need an element for observer to be created
    const element = document.createElement('div')
    Object.defineProperty(result.current.ref, 'current', {
      writable: true,
      value: element
    })

    rerender()

    await waitFor(() => {
      expect(mockObserverInstance).toBeDefined()
      expect(mockObserverInstance.options?.threshold).toEqual(threshold)
    })
  })

  it('cleans up observer on unmount', async () => {
    const { result, unmount, rerender } = renderHook(() => useIntersectionObserver())

    const element = document.createElement('div')
    Object.defineProperty(result.current.ref, 'current', {
      writable: true,
      value: element
    })

    // Trigger re-render to observe element
    rerender()

    await waitFor(() => {
      expect(mockObserverInstance).toBeDefined()
    })

    const disconnectSpy = vi.spyOn(mockObserverInstance, 'disconnect')

    unmount()

    expect(disconnectSpy).toHaveBeenCalled()
  })

  it('returns entry object with intersection details', async () => {
    const { result, rerender } = renderHook(() => useIntersectionObserver())

    const element = document.createElement('div')
    Object.defineProperty(result.current.ref, 'current', {
      writable: true,
      value: element
    })

    // Trigger re-render to observe element
    rerender()

    await waitFor(() => {
      expect(mockObserverInstance).toBeDefined()
    })

    const mockEntry = {
      target: element,
      isIntersecting: true,
      intersectionRatio: 0.75,
      time: 1234,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null
    } as IntersectionObserverEntry

    act(() => {
      observerCallback([mockEntry], mockObserverInstance)
    })

    expect(result.current.entry).not.toBeNull()
    expect(result.current.entry?.intersectionRatio).toBe(0.75)
    expect(result.current.entry?.time).toBe(1234)
    expect(result.current.entry?.target).toBe(element)
  })

  it('handles rootMargin option', async () => {
    const rootMargin = '10px 20px'
    const { result, rerender } = renderHook(() => useIntersectionObserver({ rootMargin }))

    // Need an element for observer to be created
    const element = document.createElement('div')
    Object.defineProperty(result.current.ref, 'current', {
      writable: true,
      value: element
    })

    rerender()

    await waitFor(() => {
      expect(mockObserverInstance).toBeDefined()
      expect(mockObserverInstance.options?.rootMargin).toBe(rootMargin)
    })
  })

  it('handles root option', async () => {
    const rootElement = document.createElement('div')
    const { result, rerender } = renderHook(() => useIntersectionObserver({ root: rootElement }))

    // Need an element for observer to be created
    const element = document.createElement('div')
    Object.defineProperty(result.current.ref, 'current', {
      writable: true,
      value: element
    })

    rerender()

    await waitFor(() => {
      expect(mockObserverInstance).toBeDefined()
      expect(mockObserverInstance.options?.root).toBe(rootElement)
    })
  })

  it('updates isIntersecting when element leaves viewport', async () => {
    const { result, rerender } = renderHook(() => useIntersectionObserver())

    const element = document.createElement('div')
    Object.defineProperty(result.current.ref, 'current', {
      writable: true,
      value: element
    })

    // Trigger re-render to observe element
    rerender()

    await waitFor(() => {
      expect(mockObserverInstance).toBeDefined()
    })

    // First, element enters viewport
    act(() => {
      observerCallback([{
        target: element,
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: 0
      }] as IntersectionObserverEntry[], mockObserverInstance)
    })

    expect(result.current.isIntersecting).toBe(true)

    // Then element leaves viewport
    act(() => {
      observerCallback([{
        target: element,
        isIntersecting: false,
        intersectionRatio: 0,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: 0
      }] as IntersectionObserverEntry[], mockObserverInstance)
    })

    expect(result.current.isIntersecting).toBe(false)
  })

  it('is SSR-safe and returns initial state when IntersectionObserver is not available', () => {
    // Remove IntersectionObserver
    vi.unstubAllGlobals()

    const { result } = renderHook(() => useIntersectionObserver())

    expect(result.current.ref.current).toBeNull()
    expect(result.current.isIntersecting).toBe(false)
    expect(result.current.entry).toBeNull()
  })
})