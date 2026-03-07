// @ts-nocheck
import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, BookOpen, Plus, Trash2, BarChart3, PieChart, TrendingUp, Lightbulb, Edit3 } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useDataStoryStore } from '@/entities/data-story/data-story.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

const CHART_TYPES = ['bar', 'line', 'pie', 'area', 'scatter'] as const
type ChartType = (typeof CHART_TYPES)[number]

const CHART_ICONS: Record<string, typeof BarChart3> = {
  bar: BarChart3,
  line: TrendingUp,
  pie: PieChart,
  area: TrendingUp,
  scatter: BarChart3,
}

export function DataStoryPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)

  const {
    stories,
    selectedStoryId,
    selectedChapterIndex,
    hydrate,
    createStory,
    deleteStory,
    selectStory,
    selectChapter,
    addChapter,
    updateChapterNarrative,
    setChapterChartType,
    addInsight,
    removeInsight,
  } = useDataStoryStore(
    useShallow((s) => ({
      stories: s.stories,
      selectedStoryId: s.selectedStoryId,
      selectedChapterIndex: s.selectedChapterIndex,
      hydrate: s.hydrate,
      createStory: s.createStory,
      deleteStory: s.deleteStory,
      selectStory: s.selectStory,
      selectChapter: s.selectChapter,
      addChapter: s.addChapter,
      updateChapterNarrative: s.updateChapterNarrative,
      setChapterChartType: s.setChapterChartType,
      addInsight: s.addInsight,
      removeInsight: s.removeInsight,
    }))
  )

  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [insightText, setInsightText] = useState('')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const selectedStory = stories.find((s) => s.id === selectedStoryId) ?? null
  const selectedChapter = selectedStory?.chapters[selectedChapterIndex ?? -1] ?? null

  function handleCreate() {
    if (!newTitle.trim()) return
    createStory(newTitle.trim(), newDescription.trim())
    setShowCreate(false)
    setNewTitle('')
    setNewDescription('')
  }

  function handleDelete(id: string) {
    if (confirm((t as any)('dataStory.deleteConfirm'))) {
      deleteStory(id)
    }
  }

  function handleAddInsight() {
    if (!insightText.trim() || !selectedStoryId || selectedChapterIndex == null) return
    addInsight(selectedStoryId, selectedChapterIndex, insightText.trim())
    setInsightText('')
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView('home')}
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <BookOpen className="w-5 h-5 text-[var(--color-accent)]" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {(t as any)('dataStory.title')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {(t as any)('dataStory.subtitle')}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />
          {(t as any)('dataStory.new')}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Story + Chapter List */}
        <div className="w-80 border-r border-[var(--color-border)] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {stories.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <BookOpen className="w-10 h-10 mx-auto mb-2 text-zinc-400" />
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {(t as any)('dataStory.empty')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {stories.map((story) => (
                  <div key={story.id}>
                    <button
                      onClick={() => selectStory(story.id)}
                      className={`w-full text-left p-3 hover:bg-[var(--color-bg-secondary)] ${
                        selectedStoryId === story.id ? 'bg-[var(--color-bg-secondary)]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate flex-1">{story.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(story.id)
                          }}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">
                        {story.description || (t as any)('dataStory.noDescription')}
                      </p>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {story.chapters.length} {(t as any)('dataStory.chapters')}
                      </span>
                    </button>

                    {/* Chapters sub-list */}
                    {selectedStoryId === story.id && (
                      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                        {story.chapters.map((chapter, idx) => (
                          <button
                            key={idx}
                            onClick={() => selectChapter(idx)}
                            className={`w-full text-left px-6 py-2 text-sm hover:bg-[var(--color-bg-primary)] ${
                              selectedChapterIndex === idx
                                ? 'text-[var(--color-accent)] font-medium'
                                : 'text-[var(--color-text-secondary)]'
                            }`}
                          >
                            {idx + 1}. {chapter.title}
                          </button>
                        ))}
                        <button
                          onClick={() => addChapter(story.id)}
                          className="w-full text-left px-6 py-2 text-sm text-[var(--color-accent)] hover:bg-[var(--color-bg-primary)]"
                        >
                          <Plus className="w-3 h-3 inline mr-1" />
                          {(t as any)('dataStory.addChapter')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Chapter Editor */}
        <div className="flex-1 overflow-auto">
          {selectedChapter ? (
            <div className="p-6 max-w-3xl mx-auto space-y-6">
              {/* Chapter Title */}
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                {selectedChapter.title}
              </h2>

              {/* Narrative Editor */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Edit3 className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
                    {(t as any)('dataStory.narrative')}
                  </h3>
                </div>
                <textarea
                  value={selectedChapter.narrative}
                  onChange={(e) =>
                    selectedStoryId &&
                    selectedChapterIndex != null &&
                    updateChapterNarrative(selectedStoryId, selectedChapterIndex, e.target.value)
                  }
                  placeholder={(t as any)('dataStory.narrativePlaceholder')}
                  rows={6}
                  className="w-full p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>

              {/* Chart Type Selector */}
              <div>
                <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  {(t as any)('dataStory.chartType')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {CHART_TYPES.map((ct) => {
                    const Icon = CHART_ICONS[ct] ?? BarChart3
                    return (
                      <button
                        key={ct}
                        onClick={() =>
                          selectedStoryId &&
                          selectedChapterIndex != null &&
                          setChapterChartType(selectedStoryId, selectedChapterIndex, ct)
                        }
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                          selectedChapter.chartType === ct
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                            : 'border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {ct}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Insights */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
                    {(t as any)('dataStory.insights')}
                  </h3>
                </div>
                <div className="space-y-2 mb-3">
                  {selectedChapter.insights.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-secondary)] italic">
                      {(t as any)('dataStory.noInsights')}
                    </p>
                  ) : (
                    selectedChapter.insights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
                      >
                        <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                        <p className="text-sm text-[var(--color-text-primary)] flex-1">
                          {insight.text}
                        </p>
                        <button
                          onClick={() =>
                            selectedStoryId &&
                            selectedChapterIndex != null &&
                            removeInsight(selectedStoryId, selectedChapterIndex, idx)
                          }
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={insightText}
                    onChange={(e) => setInsightText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddInsight()}
                    placeholder={(t as any)('dataStory.insightPlaceholder')}
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm"
                  />
                  <Button onClick={handleAddInsight} disabled={!insightText.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : selectedStory ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="text-[var(--color-text-secondary)]">
                  {(t as any)('dataStory.selectChapter')}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="text-[var(--color-text-secondary)]">
                  {(t as any)('dataStory.selectStory')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-bg-primary)] rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">
              {(t as any)('dataStory.createTitle')}
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={(t as any)('dataStory.titlePlaceholder')}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-secondary)]"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={(t as any)('dataStory.descriptionPlaceholder')}
                rows={3}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-secondary)] text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreate}>{t('common.save')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
