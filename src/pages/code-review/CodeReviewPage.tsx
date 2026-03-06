import { useEffect, useState } from 'react'
import { Plus, Trash2, CheckCircle, Code, AlertTriangle, Info, Lightbulb, Shield } from 'lucide-react'
import { useCodeReviewStore } from '@/entities/code-review/code-review.store'
import { useTranslation } from '@/shared/i18n'
import type { ReviewSeverity } from '@/shared/types'

const SEV_ICONS: Record<ReviewSeverity, typeof Shield> = { critical: Shield, warning: AlertTriangle, info: Info, suggestion: Lightbulb }
const SEV_COLORS: Record<ReviewSeverity, string> = { critical: 'text-red-500 bg-red-500/10', warning: 'text-amber-500 bg-amber-500/10', info: 'text-blue-500 bg-blue-500/10', suggestion: 'text-green-500 bg-green-500/10' }

export function CodeReviewPage() {
  const { t } = useTranslation()
  const sessions = useCodeReviewStore((s) => s.sessions)
  const selectedSessionId = useCodeReviewStore((s) => s.selectedSessionId)
  const hydrate = useCodeReviewStore((s) => s.hydrate)
  const createSession = useCodeReviewStore((s) => s.createSession)
  const deleteSession = useCodeReviewStore((s) => s.deleteSession)
  const markResolved = useCodeReviewStore((s) => s.markResolved)
  const setSelectedSessionId = useCodeReviewStore((s) => s.setSelectedSessionId)
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const lang = 'typescript'

  useEffect(() => { hydrate() }, [hydrate])

  const handleAdd = async () => {
    if (!code.trim()) return
    await createSession(title || 'Untitled Review', lang, code)
    setTitle(''); setCode(''); setShowAdd(false)
  }

  const selected = sessions.find((s) => s.id === selectedSessionId)

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2"><Code className="w-5 h-5 text-primary" />{t('codeReview.title')}</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm"><Plus className="w-4 h-4" />{t('codeReview.newReview')}</button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 border-r border-border overflow-y-auto">
          {sessions.map((s) => (
            <div key={s.id} onClick={() => setSelectedSessionId(s.id)} className={`p-3 border-b border-border cursor-pointer hover:bg-surface-secondary ${s.id === selectedSessionId ? 'bg-surface-secondary' : ''}`}>
              <p className="text-sm text-text-primary truncate">{s.title}</p>
              <p className="text-[10px] text-text-tertiary">{s.comments.length} comments · {s.status}</p>
            </div>
          ))}
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-text-tertiary text-sm">{t('codeReview.selectSession')}</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-text-primary">{selected.title} <span className="text-xs text-text-tertiary font-mono ml-2">{selected.language}</span></h2>
                <div className="flex gap-1.5">
                  {selected.status !== 'resolved' && <button onClick={() => markResolved(selected.id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm"><CheckCircle className="w-4 h-4" />{t('codeReview.resolve')}</button>}
                  <button onClick={() => deleteSession(selected.id)} className="p-1.5 rounded hover:bg-red-500/10"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
              <pre className="p-4 rounded-lg bg-[#1e1e1e] text-[#d4d4d4] text-sm font-mono overflow-x-auto whitespace-pre-wrap">{selected.code}</pre>
              {selected.comments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-text-primary">{t('codeReview.comments')} ({selected.comments.length})</h3>
                  {selected.comments.map((c) => { const Icon = SEV_ICONS[c.severity]; return (
                    <div key={c.id} className={`p-3 rounded-lg ${SEV_COLORS[c.severity]}`}>
                      <div className="flex items-center gap-2 mb-1"><Icon className="w-3.5 h-3.5" /><span className="text-xs font-medium">{c.severity} · {c.category}</span><span className="text-[10px] text-text-tertiary">line {c.line}</span></div>
                      <p className="text-sm">{c.message}</p>
                      {c.suggestion && <p className="text-xs mt-1 opacity-75">💡 {c.suggestion}</p>}
                    </div>
                  )})}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAdd(false)}>
          <div className="bg-surface rounded-xl p-6 w-[480px] space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-text-primary">{t('codeReview.newReview')}</h3>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('codeReview.reviewTitle')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border" />
            <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('codeReview.pasteCode')} className="w-full px-3 py-2 text-sm rounded-lg bg-surface-secondary border border-border font-mono min-h-[150px]" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm rounded-lg bg-surface-secondary">{t('common.cancel')}</button>
              <button onClick={handleAdd} className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white">{t('codeReview.startReview')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
