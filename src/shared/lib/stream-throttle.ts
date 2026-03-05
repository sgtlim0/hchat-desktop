/**
 * requestAnimationFrame-based streaming text update throttler.
 * Executes callback at most once per frame (~16ms) to maintain 60fps.
 */
export function createStreamThrottle() {
  let pendingText = ''
  let rafId: number | null = null

  return {
    update(text: string, callback: (text: string) => void) {
      pendingText = text
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          callback(pendingText)
          rafId = null
        })
      }
    },
    flush(callback: (text: string) => void) {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      if (pendingText) {
        callback(pendingText)
      }
    },
    cancel() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      pendingText = ''
    },
  }
}
