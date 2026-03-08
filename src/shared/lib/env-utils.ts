export function isDev(): boolean {
  return import.meta.env.DEV === true
}

export function isProd(): boolean {
  return import.meta.env.PROD === true
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export function isServer(): boolean {
  return !isBrowser()
}

export function isMobile(): boolean {
  if (!isBrowser()) return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function isTouch(): boolean {
  if (!isBrowser()) return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function isMac(): boolean {
  if (!isBrowser()) return false
  return /Mac/i.test(navigator.platform || navigator.userAgent)
}

export function isWindows(): boolean {
  if (!isBrowser()) return false
  return /Win/i.test(navigator.platform || navigator.userAgent)
}

export function getEnvVar(key: string, fallback = ''): string {
  try {
    return (import.meta.env[key] as string) ?? fallback
  } catch {
    return fallback
  }
}

export function getAppVersion(): string {
  return getEnvVar('VITE_APP_VERSION', '1.0.0')
}
