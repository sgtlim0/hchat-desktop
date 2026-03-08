export interface AtlassianCredentials {
  baseUrl: string
  email: string
  apiToken: string
}

export interface ConnectionTestResult {
  success: boolean
  latencyMs: number
  error?: string
}

export interface ToolSearchResult {
  type: 'confluence' | 'jira'
  title: string
  url: string
  excerpt: string
  key?: string
  space?: string
  status?: string
  assignee?: string
  updated?: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export async function testAtlassianConnection(
  type: 'confluence' | 'jira',
  credentials: AtlassianCredentials,
): Promise<ConnectionTestResult> {
  const start = Date.now()
  try {
    const res = await fetch(`${API_BASE}/api/tools/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, credentials }),
    })
    const data = await res.json()
    return {
      success: data.success,
      latencyMs: Date.now() - start,
      error: data.error,
    }
  } catch (err) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  }
}

export async function searchAtlassian(
  query: string,
  credentials: AtlassianCredentials,
  targets: ('confluence' | 'jira')[] = ['confluence', 'jira'],
  limit = 5,
): Promise<ToolSearchResult[]> {
  try {
    const res = await fetch(`${API_BASE}/api/tools/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, credentials, targets, limit }),
    })
    const data = await res.json()
    return data.results ?? []
  } catch {
    return []
  }
}

export function isCredentialsComplete(creds: AtlassianCredentials): boolean {
  return !!(creds.baseUrl.trim() && creds.email.trim() && creds.apiToken.trim())
}

export function buildAtlassianContext(results: ToolSearchResult[]): string {
  if (results.length === 0) return ''

  const lines = results.map((r) => {
    if (r.type === 'confluence') {
      return `[Confluence: ${r.title}] (${r.space ?? ''})\n${r.excerpt}\nURL: ${r.url}`
    }
    return `[Jira ${r.key ?? ''}: ${r.title}] (${r.status ?? ''})\n담당: ${r.assignee ?? ''}\n${r.excerpt}\nURL: ${r.url}`
  })

  return `---사내 검색 결과---\n${lines.join('\n\n')}\n---사내 검색 결과 끝---`
}
