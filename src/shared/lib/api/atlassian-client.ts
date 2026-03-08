import type {
  AtlassianCreds,
  BedrockCreds,
  VerifyResult,
  ConfluenceSearchResponse,
  PageSummaryResponse,
  JiraSearchResponse,
  TicketAnalysisResponse,
} from '@/shared/types/atlassian'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || err.message || `API error ${res.status}`)
  }
  return res.json()
}

export async function verifyAtlassian(atlassian: AtlassianCreds): Promise<VerifyResult> {
  return post<VerifyResult>('/api/verify/atlassian', { atlassian })
}

export async function verifyBedrock(bedrock: BedrockCreds): Promise<VerifyResult> {
  return post<VerifyResult>('/api/verify/bedrock', { bedrock })
}

export async function searchConfluence(params: {
  atlassian: AtlassianCreds
  bedrock: BedrockCreds
  query: string
  space_keys?: string[]
  page_ids?: string[]
  max_results?: number
  ai_summary?: boolean
}): Promise<ConfluenceSearchResponse> {
  return post<ConfluenceSearchResponse>('/api/confluence/search', params)
}

export async function summarizePage(params: {
  atlassian: AtlassianCreds
  bedrock: BedrockCreds
  page_id: string
  user_query?: string
}): Promise<PageSummaryResponse> {
  return post<PageSummaryResponse>('/api/confluence/summarize', params)
}

export async function searchJira(params: {
  atlassian: AtlassianCreds
  bedrock: BedrockCreds
  query: string
  project_keys?: string[]
  ticket_ids?: string[]
  max_results?: number
  ai_summary?: boolean
}): Promise<JiraSearchResponse> {
  return post<JiraSearchResponse>('/api/jira/search', params)
}

export async function analyzeTicket(params: {
  atlassian: AtlassianCreds
  bedrock: BedrockCreds
  issue_key: string
  user_query?: string
}): Promise<TicketAnalysisResponse> {
  return post<TicketAnalysisResponse>('/api/jira/summarize', params)
}
