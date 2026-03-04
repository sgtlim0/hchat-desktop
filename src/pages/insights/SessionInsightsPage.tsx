import { Sparkles, X, Users, TrendingUp } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useInsightsStore } from '@/entities/insights/insights.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

export function SessionInsightsPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const { clusters, patterns, isAnalyzing, setIsAnalyzing, setClusters, setPatterns } =
    useInsightsStore()

  function handleAnalyze() {
    setIsAnalyzing(true)

    // Simulate analysis
    setTimeout(() => {
      setClusters([
        {
          id: 'cluster-1',
          label: 'Technical Documentation',
          sessionIds: ['s1', 's2', 's3'],
          commonTopics: ['API design', 'TypeScript', 'testing'],
          avgCost: 2.45,
        },
        {
          id: 'cluster-2',
          label: 'Code Review',
          sessionIds: ['s4', 's5'],
          commonTopics: ['refactoring', 'best practices', 'performance'],
          avgCost: 1.82,
        },
      ])

      setPatterns([
        {
          id: 'pattern-1',
          pattern: 'Frequently asking for TypeScript type definitions',
          frequency: 12,
          suggestion: 'Create a reusable prompt template for type generation',
          type: 'template',
        },
        {
          id: 'pattern-2',
          pattern: 'Session context grows beyond 100k tokens',
          frequency: 8,
          suggestion: 'Enable auto-compression or split into smaller sessions',
          type: 'optimization',
        },
        {
          id: 'pattern-3',
          pattern: 'Similar project instructions across sessions',
          frequency: 15,
          suggestion: 'Store as project memory for automatic context injection',
          type: 'memory',
        },
      ])

      setIsAnalyzing(false)
    }, 2000)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('home')}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hover transition text-text-tertiary hover:text-text-primary"
          >
            <X size={18} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{t('sessionInsights.title')}</h1>
            <p className="text-xs text-text-tertiary">{t('sessionInsights.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Analyze Button */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="md"
            className="gap-2"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            <Sparkles size={16} />
            {isAnalyzing ? t('sessionInsights.analyzing') : t('sessionInsights.analyze')}
          </Button>
        </div>

        {/* Clusters */}
        {clusters.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Users size={16} className="text-primary" />
              {t('sessionInsights.clusters')}
            </h2>
            <div className="space-y-3">
              {clusters.map((cluster) => (
                <div key={cluster.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-text-primary mb-1">
                        {cluster.label}
                      </h3>
                      <p className="text-xs text-text-tertiary">
                        {cluster.sessionIds.length} {t('sessionInsights.sessions')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">${cluster.avgCost.toFixed(2)}</p>
                      <p className="text-xs text-text-tertiary">{t('sessionInsights.avgCost')}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-text-secondary mb-2">
                      {t('sessionInsights.commonTopics')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cluster.commonTopics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patterns */}
        {patterns.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              {t('sessionInsights.patterns')}
            </h2>
            <div className="space-y-3">
              {patterns.map((pattern) => (
                <div key={pattern.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                            pattern.type === 'template'
                              ? 'bg-blue-500/10 text-blue-500'
                              : pattern.type === 'memory'
                              ? 'bg-purple-500/10 text-purple-500'
                              : 'bg-green-500/10 text-green-500'
                          }`}
                        >
                          {t(
                            `sessionInsights.type.${pattern.type}` as keyof typeof import('@/shared/i18n/ko').default
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary font-medium mb-1">{pattern.pattern}</p>
                      <p className="text-xs text-text-tertiary">
                        {t('sessionInsights.frequency')}: {pattern.frequency}x
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-text-secondary mb-1">
                      {t('sessionInsights.suggestion')}
                    </p>
                    <p className="text-xs text-text-primary">{pattern.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {clusters.length === 0 && patterns.length === 0 && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles size={32} className="text-primary/50" />
            </div>
            <p className="text-text-secondary text-sm font-medium">{t('sessionInsights.noData')}</p>
            <p className="text-text-tertiary text-xs mt-1">Click analyze to discover patterns</p>
          </div>
        )}
      </div>
    </div>
  )
}
