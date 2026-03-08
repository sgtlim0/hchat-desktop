import { useSettingsStore } from '../../entities/settings/settings.store'

/**
 * Synchronizes the app theme with the system's color scheme preference
 *
 * Usage:
 * ```typescript
 * // In your app's main component or initialization
 * useEffect(() => {
 *   const cleanup = syncThemeWithSystem()
 *   return cleanup // Clean up on unmount
 * }, [])
 * ```
 *
 * @returns Cleanup function to remove the event listener
 */
export function syncThemeWithSystem(): () => void {
  // Skip if matchMedia is not supported
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {} // Return no-op cleanup function
  }

  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const store = useSettingsStore.getState()

  // Set initial theme if different from current
  const systemIsDark = darkModeQuery.matches
  if (systemIsDark !== store.darkMode) {
    // Use setState directly to set specific value
    useSettingsStore.setState({ darkMode: systemIsDark })
  }

  // Handler for system preference changes
  const handleChange = (e: MediaQueryListEvent) => {
    const currentStore = useSettingsStore.getState()
    const newIsDark = e.matches

    // Only update if different from current store value
    if (newIsDark !== currentStore.darkMode) {
      // Use setState directly to set specific value
      useSettingsStore.setState({ darkMode: newIsDark })
    }
  }

  // Add listener for changes
  darkModeQuery.addEventListener('change', handleChange)

  // Return cleanup function
  return () => {
    darkModeQuery.removeEventListener('change', handleChange)
  }
}