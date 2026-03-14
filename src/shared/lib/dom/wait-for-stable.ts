/**
 * Wait for DOM to stabilize after navigation/mutation.
 *
 * Resolves when no DOM mutations occur for `stableMs` milliseconds,
 * or after `timeoutMs` maximum wait. Uses a single-resolve gate to
 * prevent race conditions between multiple resolve paths.
 */
export function waitForDOMStable(
  target: Node = document.body,
  options: { stableMs?: number; timeoutMs?: number } = {},
): Promise<void> {
  const { stableMs = 300, timeoutMs = 2000 } = options

  return new Promise((resolve) => {
    let resolved = false
    let stableTimer: ReturnType<typeof setTimeout> | null = null
    let maxTimer: ReturnType<typeof setTimeout> | null = null
    let observer: MutationObserver | null = null

    const done = () => {
      if (resolved) return
      resolved = true

      if (observer) {
        observer.disconnect()
        observer = null
      }
      if (stableTimer) {
        clearTimeout(stableTimer)
        stableTimer = null
      }
      if (maxTimer) {
        clearTimeout(maxTimer)
        maxTimer = null
      }

      resolve()
    }

    observer = new MutationObserver(() => {
      if (stableTimer) clearTimeout(stableTimer)
      stableTimer = setTimeout(done, stableMs)
    })

    observer.observe(target, { childList: true, subtree: true })

    // Max wait timeout
    maxTimer = setTimeout(done, timeoutMs)

    // If already stable (no mutations within stableMs)
    stableTimer = setTimeout(done, stableMs)
  })
}
