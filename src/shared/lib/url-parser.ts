export interface ParsedUrl {
  protocol: string
  host: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
  origin: string
  params: Record<string, string>
}

export function parseUrl(url: string): ParsedUrl {
  const parsed = new URL(url)
  const params: Record<string, string> = {}
  parsed.searchParams.forEach((value, key) => {
    params[key] = value
  })

  return {
    protocol: parsed.protocol,
    host: parsed.host,
    hostname: parsed.hostname,
    port: parsed.port,
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
    origin: parsed.origin,
    params,
  }
}

export function buildUrl(base: string, params?: Record<string, string>): string {
  const url = new URL(base)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

export function getQueryParam(url: string, key: string): string | null {
  try {
    return new URL(url).searchParams.get(key)
  } catch {
    return null
  }
}

export function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

export function joinPaths(...parts: string[]): string {
  return parts
    .map((p, i) => {
      if (i === 0) return p.replace(/\/+$/, '')
      if (i === parts.length - 1) return p.replace(/^\/+/, '')
      return p.replace(/^\/+|\/+$/g, '')
    })
    .filter(Boolean)
    .join('/')
}
