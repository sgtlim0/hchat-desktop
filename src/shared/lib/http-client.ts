interface HttpOptions {
  headers?: Record<string, string>
  timeout?: number
}

interface HttpResponse<T> {
  data: T
  status: number
  ok: boolean
}

class HttpClient {
  constructor(
    private baseUrl = '',
    private defaultHeaders: Record<string, string> = {},
  ) {}

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    options?: HttpOptions,
  ): Promise<HttpResponse<T>> {
    const fullUrl = this.baseUrl ? `${this.baseUrl}${url}` : url
    const controller = new AbortController()
    const timeout = options?.timeout ?? 30000
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const res = await fetch(fullUrl, {
        method,
        headers: { 'Content-Type': 'application/json', ...this.defaultHeaders, ...options?.headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
      clearTimeout(timer)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      return { data, status: res.status, ok: true }
    } catch (err) {
      clearTimeout(timer)
      throw err
    }
  }

  get<T>(url: string, options?: HttpOptions) { return this.request<T>('GET', url, undefined, options) }
  post<T>(url: string, body: unknown, options?: HttpOptions) { return this.request<T>('POST', url, body, options) }
  put<T>(url: string, body: unknown, options?: HttpOptions) { return this.request<T>('PUT', url, body, options) }
  delete<T>(url: string, options?: HttpOptions) { return this.request<T>('DELETE', url, undefined, options) }
}

export function createHttpClient(baseUrl?: string, headers?: Record<string, string>): HttpClient {
  return new HttpClient(baseUrl, headers)
}
