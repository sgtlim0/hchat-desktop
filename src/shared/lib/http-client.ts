interface HttpOptions {
  headers?: Record<string, string>
  timeout?: number
}

interface HttpResponse<T> {
  data: T
  status: number
  headers: Headers
}

export class HttpClient {
  private baseUrl?: string
  private defaultHeaders?: Record<string, string>

  constructor(
    baseUrl?: string,
    defaultHeaders?: Record<string, string>
  ) {
    this.baseUrl = baseUrl
    this.defaultHeaders = defaultHeaders
  }

  private buildUrl(url: string): string {
    // If url is absolute, use it as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    // Otherwise, combine with base URL
    return this.baseUrl ? `${this.baseUrl}${url}` : url
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    options?: HttpOptions
  ): Promise<HttpResponse<T>> {
    const fullUrl = this.buildUrl(url)

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options?.headers
    }

    // Only add Content-Type for methods with body
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      headers['Content-Type'] = 'application/json'
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    }

    // Handle timeout with AbortController
    if (options?.timeout) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), options.timeout)

      fetchOptions.signal = controller.signal

      try {
        const response = await fetch(fullUrl, fetchOptions)
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return {
          data,
          status: response.status,
          headers: response.headers
        }
      } catch (error: unknown) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request aborted')
        }
        throw error
      }
    }

    // No timeout - regular fetch
    const response = await fetch(fullUrl, fetchOptions)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return {
      data,
      status: response.status,
      headers: response.headers
    }
  }

  async get<T>(url: string, options?: HttpOptions): Promise<HttpResponse<T>> {
    return this.request<T>('GET', url, undefined, options)
  }

  async post<T>(url: string, body: unknown, options?: HttpOptions): Promise<HttpResponse<T>> {
    return this.request<T>('POST', url, body, options)
  }

  async put<T>(url: string, body: unknown, options?: HttpOptions): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', url, body, options)
  }

  async delete<T>(url: string, options?: HttpOptions): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', url, undefined, options)
  }
}

export function createHttpClient(baseUrl?: string, headers?: Record<string, string>): HttpClient {
  return new HttpClient(baseUrl, headers)
}
