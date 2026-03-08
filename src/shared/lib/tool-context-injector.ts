import { searchAtlassian, buildAtlassianContext, isCredentialsComplete } from './tool-connector'
import type { AtlassianCredentials } from './tool-connector'

interface ActiveTools {
  confluence: boolean
  jira: boolean
}

export interface ToolInjectionResult {
  context: string
  searchPerformed: boolean
  resultCount: number
}

export async function injectToolContext(
  query: string,
  activeTools: ActiveTools,
  credentials: AtlassianCredentials,
): Promise<ToolInjectionResult> {
  if (!query.trim()) return { context: '', searchPerformed: false, resultCount: 0 }
  if (!activeTools.confluence && !activeTools.jira) return { context: '', searchPerformed: false, resultCount: 0 }
  if (!isCredentialsComplete(credentials)) return { context: '', searchPerformed: false, resultCount: 0 }

  const targets: ('confluence' | 'jira')[] = []
  if (activeTools.confluence) targets.push('confluence')
  if (activeTools.jira) targets.push('jira')

  const results = await searchAtlassian(query, credentials, targets, 5)
  const context = buildAtlassianContext(results)

  return {
    context,
    searchPerformed: true,
    resultCount: results.length,
  }
}

export function buildToolSystemPrompt(
  basePrompt: string,
  toolContext: string,
): string {
  if (!toolContext) return basePrompt
  return basePrompt
    ? `${basePrompt}\n\n${toolContext}\n\n위 사내 검색 결과를 참고하여 답변하세요. 출처(문서명 또는 이슈 키)를 반드시 언급하세요.`
    : `${toolContext}\n\n위 사내 검색 결과를 참고하여 답변하세요. 출처를 반드시 언급하세요.`
}
