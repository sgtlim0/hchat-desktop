import { useEffect, useState } from 'react'
import { Clock, Trash2, Search, ChevronRight, MessageCircle, Tag } from 'lucide-react'
import { useConversationTimelineStore } from '@/entities/conversation-timeline/conversation-timeline.store'
import { useTranslation } from '@/shared/i18n'

export function ConversationTimelinePage() {
  const { t } = useTranslation()
  const segments = useConversationTimelineStore((s) => s.segments)
  const loadSegments = useConversationTimelineStore((s) => s.loadSegments)
  const removeSegment = useConversationTimelineStore((s) => s.removeSegment)
  const clearSegments = useConversationTimelineStore((s) => s.clearSegments)

  const [sessionId, setSessionId] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (sessionId.trim()) {
      loadSegments(sessionId.trim())
    }
  }, [sessionId, loadSegments])

  const filtered = search
    ? segments.filter((s) =>
        s.topic.toLowerCase().includes(search.toLowerCase()) ||
        s.summary.toLowerCase().includes(search.toLowerCase())
      )
    : segments

  const totalRange = segments.length > 0
    ? { min: Math.min(...segments.map((s) => s.startIndex)), max: Math.max(...segments.map((s) => s.endIndex)) }
    : { min: 0, max: 1 }

  const getWidthPercent = (start: number, end: number) => {
    const range = totalRange.max - totalRange.min || 1
    return ((end - start) / range) * 100
  }

  const getLeftPercent = (start: number) => {
    const range = totalRange.max - totalRange.min || 1
    return ((start - totalRange.min) / range) * 100
  }

  const TOPIC_COLORS = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-red-500', 'bg-indigo-500',
  ]

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />{t('conversationTimeline.title')}
        </h1>
        {segments.length > 0 && (
          <button onClick={clearSegments} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary text-text-secondary rounded-lg text-sm hover:bg-surface-tertiary">
            <Trash2 className="w-4 h-4" />{t('conversationTimeline.clear')}
          </button>
        )}
      </div>

      {/* Session ID Input + Search */}
      <div className="px-6 py-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder={t('conversationTimeline.sessionIdPlaceholder')}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-surface-secondary border border-border"
          />
        </div>
        {segments.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t('conversationTimeline.search')} className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-surface-secondary border border-border" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {segments.length === 0 && (
          <p className="text-center text-text-tertiary text-sm py-12">{t('conversationTimeline.empty')}</p>
        )}

        {segments.length > 0 && (
          <>
            {/* Visual Timeline Bar */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-secondary mb-2">{t('conversationTimeline.overview')}</h3>
              <div className="relative h-10 bg-surface-secondary rounded-lg overflow-hidden border border-border">
                {segments.map((seg, idx) => (
                  <div
                    key={seg.id}
                    className={`absolute top-1 bottom-1 rounded ${TOPIC_COLORS[idx % TOPIC_COLORS.length]} opacity-70 hover:opacity-100 transition-opacity cursor-pointer`}
                    style={{ left: `${getLeftPercent(seg.startIndex)}%`, width: `${Math.max(getWidthPercent(seg.startIndex, seg.endIndex), 2)}%` }}
                    onMouseEnter={() => setHoveredId(seg.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    title={seg.topic}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-text-tertiary mt-1">
                <span>{t('conversationTimeline.msgIndex')} {totalRange.min}</span>
                <span>{t('conversationTimeline.msgIndex')} {totalRange.max}</span>
              </div>
            </div>

            {/* Segment List */}
            <div className="space-y-3">
              {filtered.map((seg, idx) => (
                <div
                  key={seg.id}
                  className={`p-4 rounded-xl border bg-surface transition-all ${hoveredId === seg.id ? 'border-primary shadow-sm' : 'border-border'}`}
                  onMouseEnter={() => setHoveredId(seg.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${TOPIC_COLORS[idx % TOPIC_COLORS.length]}`} />
                      <h3 className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />{seg.topic}
                      </h3>
                    </div>
                    <button onClick={() => removeSegment(seg.id)} className="p-1 rounded hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>

                  <p className="text-sm text-text-secondary leading-relaxed mb-2">{seg.summary}</p>

                  <div className="flex items-center gap-3 text-xs text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {t('conversationTimeline.messages')} {seg.startIndex}-{seg.endIndex}
                    </span>
                    <span className="flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      {seg.endIndex - seg.startIndex + 1} {t('conversationTimeline.count')}
                    </span>
                    <span>{new Date(seg.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
