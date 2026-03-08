import { useEffect, useRef } from 'react'

interface UseDocumentTitleOptions {
  suffix?: string
  restoreOnUnmount?: boolean
}

/**
 * Hook to set and manage document title
 * @param title - The title to set
 * @param options - Configuration options
 * @param options.suffix - Suffix to append to title (default: " | H Chat")
 * @param options.restoreOnUnmount - Whether to restore original title on unmount (default: true)
 */
export function useDocumentTitle(
  title: string,
  options: UseDocumentTitleOptions = {}
): void {
  const {
    suffix = ' | H Chat',
    restoreOnUnmount = true
  } = options

  const originalTitle = useRef<string>('')

  useEffect(() => {
    // Store original title on first mount
    if (restoreOnUnmount && !originalTitle.current) {
      originalTitle.current = document.title
    }

    // Build the new title
    let newTitle = title
    if (title && suffix) {
      newTitle = title + suffix
    } else if (!title && suffix) {
      // Handle empty title case - just show suffix without separator
      newTitle = suffix.replace(/^\s*\|\s*/, '')
    }

    // Set the document title
    document.title = newTitle

    // Cleanup function
    return () => {
      if (restoreOnUnmount && originalTitle.current) {
        document.title = originalTitle.current
      }
    }
  }, [title, suffix, restoreOnUnmount])
}