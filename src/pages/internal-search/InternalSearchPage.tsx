import { useState } from 'react'
import { Search, Building2, FileText, Bug, Loader2, ExternalLink } from 'lucide-react'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

interface SearchResult {
  id: string
  type: 'confluence' | 'jira'
  title: string
  excerpt: string
  url: string
  status?: string // For Jira issues
  lastModified?: string
  author?: string
}

export function InternalSearchPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [targets, setTargets] = useState<('confluence' | 'jira')[]>(['confluence', 'jira'])
  const [results, setResults] = useState<SearchResult[]>([])
  const [summary, setSummary] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Toggle target
  const toggleTarget = (target: 'confluence' | 'jira') => {
    setTargets(prev =>
      prev.includes(target)
        ? prev.filter(t => t !== target)
        : [...prev, target]
    )
  }

  // Handle search
  const handleSearch = async () => {
    if (!query.trim() || targets.length === 0 || isSearching) return

    setIsSearching(true)
    setResults([])
    setSummary('')

    try {
      // Mock search for now - actual API integration comes later
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'confluence',
          title: 'H Chat 사용자 가이드',
          excerpt: 'H Chat 서비스의 기본 사용법과 주요 기능에 대한 설명입니다. AI 챗봇을 효과적으로 활용하는 방법...',
          url: 'https://confluence.example.com/pages/123',
          lastModified: '2024-03-08',
          author: 'Tech Team'
        },
        {
          id: '2',
          type: 'jira',
          title: 'HCHAT-1234: 검색 성능 개선',
          excerpt: '사내 문서 검색 기능의 응답 속도를 개선하여 사용자 경험을 향상시킵니다...',
          url: 'https://jira.example.com/browse/HCHAT-1234',
          status: 'In Progress',
          lastModified: '2024-03-07',
          author: 'Dev Team'
        },
        {
          id: '3',
          type: 'confluence',
          title: 'AI 모델 선택 가이드라인',
          excerpt: '프로젝트 요구사항에 따른 최적의 AI 모델 선택 방법과 각 모델의 특징 비교...',
          url: 'https://confluence.example.com/pages/456',
          lastModified: '2024-03-06',
          author: 'AI Team'
        }
      ]

      setResults(mockResults)
      setSummary(`검색 결과: "${query}"에 대해 ${mockResults.length}개의 관련 문서를 찾았습니다. Confluence에서는 H Chat 사용 가이드와 AI 모델 선택 가이드라인이 가장 관련성이 높으며, Jira에서는 검색 성능 개선 이슈가 진행 중입니다.`)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('internalSearch.title') || '사내 문서 검색'}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {t('internalSearch.desc') || 'Confluence와 Jira에서 관련 문서를 검색하고 AI 요약을 제공합니다'}
        </p>
      </div>

      {/* Target Toggles: Confluence / Jira */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => toggleTarget('confluence')}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
            targets.includes('confluence')
              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
              : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
          }`}
        >
          <FileText className="h-4 w-4" />
          Confluence
        </button>
        <button
          onClick={() => toggleTarget('jira')}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
            targets.includes('jira')
              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
              : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
          }`}
        >
          <Bug className="h-4 w-4" />
          Jira
        </button>
      </div>

      {/* Search Input + Button */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('internalSearch.placeholder') || '검색어를 입력하세요...'}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--primary)] focus:outline-none"
            disabled={isSearching}
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || targets.length === 0 || isSearching}
        >
          <Search className="mr-1 h-4 w-4" />
          {t('search') || '검색'}
        </Button>
      </div>

      {/* Empty State */}
      {results.length === 0 && !isSearching && !summary && (
        <div className="mt-12 text-center text-[var(--text-secondary)]">
          <Building2 className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p className="mb-3 text-sm">{t('internalSearch.empty') || '사내 문서를 검색해보세요'}</p>
          <div className="mx-auto max-w-sm space-y-1">
            <p className="text-xs">예시 검색어:</p>
            <p className="text-xs text-[var(--text-secondary)]">• "H Chat 사용 가이드"</p>
            <p className="text-xs text-[var(--text-secondary)]">• "AI 모델 성능 비교"</p>
            <p className="text-xs text-[var(--text-secondary)]">• "프로젝트 일정 현황"</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isSearching && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[var(--primary)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              {t('internalSearch.searching') || '사내 문서 검색 중...'}
            </p>
          </div>
        </div>
      )}

      {/* LLM Summary */}
      {summary && !isSearching && (
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--primary)]/10">
              <span className="text-xs font-bold text-[var(--primary)]">AI</span>
            </div>
            <span className="text-sm font-medium">{t('internalSearch.summary') || 'AI 요약'}</span>
          </div>
          <div className="prose prose-sm max-w-none text-sm text-[var(--text-primary)] dark:prose-invert">
            {summary}
          </div>
        </div>
      )}

      {/* Results List */}
      {results.length > 0 && !isSearching && (
        <div className="space-y-3">
          {results.map(result => (
            <div
              key={result.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4 transition-colors hover:bg-[var(--bg-secondary)]/80"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {result.type === 'confluence' ? (
                    <FileText className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Bug className="h-4 w-4 text-orange-500" />
                  )}
                  <h3 className="font-medium text-[var(--text-primary)]">{result.title}</h3>
                  {result.status && (
                    <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-600 dark:text-yellow-400">
                      {result.status}
                    </span>
                  )}
                </div>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary)] hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <p className="mb-2 text-sm text-[var(--text-secondary)]">
                {result.excerpt}
              </p>

              <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                <span className="capitalize">{result.type}</span>
                {result.author && (
                  <>
                    <span>•</span>
                    <span>{result.author}</span>
                  </>
                )}
                {result.lastModified && (
                  <>
                    <span>•</span>
                    <span>{result.lastModified}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}