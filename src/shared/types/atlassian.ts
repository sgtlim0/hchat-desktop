// Atlassian Integration Types

export interface AtlassianCreds {
  domain: string
  email: string
  api_token: string
}

export interface BedrockCreds {
  aws_access_key_id: string
  aws_secret_access_key: string
  aws_region: string
  model_id: string
}

export interface VerifyResult {
  valid: boolean
  display_name?: string
  email?: string
  account_id?: string
  region?: string
  model_id?: string
}

// Confluence types

export interface ConfluencePage {
  id: string
  title: string
  space: string
  space_key: string
  link: string
  excerpt: string
  last_modified: string
  source: 'direct' | 'search'
}

export interface ConfluencePageVM extends ConfluencePage {
  is_summarizing: boolean
  ai_summary: string | null
}

export interface ConfluenceSearchRequest {
  atlassian: AtlassianCreds
  bedrock: BedrockCreds
  query: string
  space_keys?: string[]
  page_ids?: string[]
  max_results?: number
  ai_summary?: boolean
}

export interface ConfluenceSearchResponse {
  query: string
  total: number
  results: ConfluencePage[]
  ai_overview: string | null
}

export interface PageSummarizeRequest {
  atlassian: AtlassianCreds
  bedrock: BedrockCreds
  page_id: string
  user_query?: string
}

export interface PageSummaryResponse {
  page_id: string
  page_title: string
  space_name: string
  page_link: string
  version: string | number
  last_modified: string
  summary: string
  char_count: number
}

// Jira types

export interface JiraTicket {
  key: string
  id: string
  summary: string
  status: string
  status_category: string
  assignee: string
  priority: string
  issue_type: string
  project: string
  project_key: string
  updated: string
  labels: string[]
  link: string
  source: 'direct' | 'search'
}

export interface JiraTicketVM extends JiraTicket {
  is_analyzing: boolean
  ai_analysis: string | null
  total_comments?: number
}

export interface JiraSearchRequest {
  atlassian: AtlassianCreds
  bedrock: BedrockCreds
  query: string
  project_keys?: string[]
  ticket_ids?: string[]
  max_results?: number
  ai_summary?: boolean
}

export interface JiraSearchResponse {
  query: string
  total: number
  results: JiraTicket[]
  ai_overview: string | null
}

export interface TicketAnalyzeRequest {
  atlassian: AtlassianCreds
  bedrock: BedrockCreds
  issue_key: string
  user_query?: string
}

export interface TicketAnalysisResponse {
  issue_key: string
  summary: string
  status: string
  assignee: string
  reporter: string
  priority: string
  issue_type: string
  created: string
  updated: string
  labels: string[]
  total_comments: number
  link: string
  ai_analysis: string
}

export function createPageVM(page: ConfluencePage): ConfluencePageVM {
  return { ...page, is_summarizing: false, ai_summary: null }
}

export function createTicketVM(ticket: JiraTicket): JiraTicketVM {
  return { ...ticket, is_analyzing: false, ai_analysis: null }
}
