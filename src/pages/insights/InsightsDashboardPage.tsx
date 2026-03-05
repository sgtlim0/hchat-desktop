import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { BarChart3, X, TrendingUp, DollarSign, Zap } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useInsightsStore } from '@/entities/insights/insights.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

type Tab = 'quality' | 'recommendations' | 'reports'

export function InsightsDashboardPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const { qualityScores, recommendations, reports, addReport } = useInsightsStore(
    useShallow((s) => ({
      qualityScores: s.qualityScores,
      recommendations: s.recommendations,
      reports: s.reports,
      addReport: s.addReport,
    }))
  )
  const [activeTab, setActiveTab] = useState<Tab>('quality')

  function handleGenerateReport(type: 'weekly' | 'monthly') {
    const period = type === 'weekly' ? 'Last 7 days' : 'Last 30 days'

    addReport({
      type,
      period,
      totalCost: Math.random() * 100,
      totalTokens: Math.floor(Math.random() * 1000000),
      topModels: [
        { modelId: 'claude-3-5-sonnet-20241022', usage: 500000, cost: 25 },
        { modelId: 'gpt-4o', usage: 300000, cost: 18 },
      ],
      savingOpportunities: [
        'Switch to Claude Haiku for simple tasks',
        'Use prompt caching for repeated queries',
      ],
      patternSummary: 'Most usage during business hours (9AM-5PM)',
    })
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
            <BarChart3 size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{t('insights.title')}</h1>
            <p className="text-xs text-text-tertiary">{t('insights.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-border px-6">
        <div className="flex gap-1">
          {(['quality', 'recommendations', 'reports'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab === 'quality' && t('insights.promptQuality')}
              {tab === 'recommendations' && t('insights.modelRecommend')}
              {tab === 'reports' && 'Reports'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Prompt Quality Tab */}
        {activeTab === 'quality' && (
          <div className="space-y-4">
            {qualityScores.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp size={32} className="text-primary/50" />
                </div>
                <p className="text-text-secondary text-sm font-medium">No quality scores yet</p>
                <p className="text-text-tertiary text-xs mt-1">Start chatting to generate insights</p>
              </div>
            ) : (
              qualityScores.map((score) => (
                <div key={score.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-text-primary">Session Quality Score</h3>
                    <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                      {score.overall}/100
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-secondary">{t('insights.clarity')}</span>
                        <span className="text-text-primary font-medium">{score.clarity}/100</span>
                      </div>
                      <div className="h-2 bg-page rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${score.clarity}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-secondary">{t('insights.specificity')}</span>
                        <span className="text-text-primary font-medium">{score.specificity}/100</span>
                      </div>
                      <div className="h-2 bg-page rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${score.specificity}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {score.suggestions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-secondary mb-2">
                        {t('insights.suggestions')}
                      </p>
                      <ul className="space-y-1">
                        {score.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-xs text-text-tertiary flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span className="flex-1">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Model Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Zap size={32} className="text-primary/50" />
                </div>
                <p className="text-text-secondary text-sm font-medium">No recommendations yet</p>
                <p className="text-text-tertiary text-xs mt-1">AI will analyze and suggest optimal models</p>
              </div>
            ) : (
              recommendations.map((rec, idx) => (
                <div key={idx} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-text-primary mb-1">
                        {t('insights.recommendedModel')}
                      </h3>
                      <p className="text-xs text-primary font-medium">{rec.modelId}</p>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                      {Math.round(rec.confidence * 100)}% {t('insights.confidence')}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">{t('insights.reason')}:</span>
                      <span className="text-xs text-text-primary">{rec.reason}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={12} className="text-text-tertiary" />
                      <span className="text-xs text-text-secondary">
                        Est. cost: ${rec.estimatedCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5"
                onClick={() => handleGenerateReport('weekly')}
              >
                <TrendingUp size={14} />
                {t('insights.weeklyReport')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => handleGenerateReport('monthly')}
              >
                <BarChart3 size={14} />
                {t('insights.monthlyReport')}
              </Button>
            </div>

            {reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 size={32} className="text-primary/50" />
                </div>
                <p className="text-text-secondary text-sm font-medium">{t('insights.noReports')}</p>
                <p className="text-text-tertiary text-xs mt-1">Generate your first report above</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary mb-1">
                        {report.type === 'weekly' ? t('insights.weeklyReport') : t('insights.monthlyReport')}
                      </h3>
                      <p className="text-xs text-text-tertiary">{report.period}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">${report.totalCost.toFixed(2)}</p>
                      <p className="text-xs text-text-tertiary">
                        {report.totalTokens.toLocaleString()} tokens
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-text-secondary mb-2">
                        {t('insights.topModels')}
                      </p>
                      <div className="space-y-1">
                        {report.topModels.map((model, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs p-2 rounded bg-page"
                          >
                            <span className="text-text-primary font-medium">{model.modelId}</span>
                            <span className="text-text-tertiary">
                              {model.usage.toLocaleString()} tokens · ${model.cost.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {report.savingOpportunities.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-text-secondary mb-2">
                          {t('insights.savings')}
                        </p>
                        <ul className="space-y-1">
                          {report.savingOpportunities.map((opp, idx) => (
                            <li key={idx} className="text-xs text-text-tertiary flex items-start gap-2">
                              <DollarSign size={12} className="text-primary mt-0.5 flex-shrink-0" />
                              <span className="flex-1">{opp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold text-text-secondary mb-1">
                        {t('insights.patternSummary')}
                      </p>
                      <p className="text-xs text-text-tertiary">{report.patternSummary}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
