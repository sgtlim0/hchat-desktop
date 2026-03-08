import { useState, useEffect, useRef, type RefObject } from 'react'

export interface UseIntersectionOptions {
  threshold?: number | number[]
  rootMargin?: string
  root?: Element | null
}

export interface UseIntersectionResult {
  ref: RefObject<Element | null>
  isIntersecting: boolean
  entry: IntersectionObserverEntry | null
}

export function useIntersectionObserver(
  options?: UseIntersectionOptions,
): UseIntersectionResult {
  const ref = useRef<Element | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)

  useEffect(() => {
    // SSR safety and check if IntersectionObserver is available
    if (typeof IntersectionObserver === 'undefined') return

    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([e]) => {
        if (e) {
          setIsIntersecting(e.isIntersecting)
          setEntry(e)
        }
      },
      {
        threshold: options?.threshold,
        rootMargin: options?.rootMargin,
        root: options?.root,
      },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref.current, options?.threshold, options?.rootMargin, options?.root])

  return { ref, isIntersecting, entry }
}
