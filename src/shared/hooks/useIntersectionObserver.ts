import { useState, useEffect, useRef, type RefObject } from 'react'

interface UseIntersectionOptions {
  threshold?: number | number[]
  rootMargin?: string
  root?: Element | null
}

interface UseIntersectionResult {
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
    if (typeof IntersectionObserver === 'undefined' || !ref.current) return

    const observer = new IntersectionObserver(
      ([e]) => {
        setIsIntersecting(e.isIntersecting)
        setEntry(e)
      },
      {
        threshold: options?.threshold,
        rootMargin: options?.rootMargin,
        root: options?.root,
      },
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [options?.threshold, options?.rootMargin, options?.root])

  return { ref, isIntersecting, entry }
}
