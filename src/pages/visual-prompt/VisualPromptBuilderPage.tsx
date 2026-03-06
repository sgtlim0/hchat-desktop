import { useEffect } from 'react'
import { Plus, Trash2, Wand2, Copy, FileText, BookOpen, Lock, LayoutTemplate, Sparkles } from 'lucide-react'
import { useVisualPromptStore } from '@/entities/visual-prompt/visual-prompt.store'
import { useTranslation } from '@/shared/i18n'
import type { PromptBlockType } from '@/shared/types'

const BLOCK_ICONS: Record<PromptBlockType, typeof FileText> = { instruction: Wand2, context: BookOpen, constraint: Lock, output_format: LayoutTemplate, example: Sparkles }
const BLOCK_COLORS: Record<PromptBlockType, string> = { instruction: 'border-blue-400', context: 'border-green-400', constraint: 'border-red-400', output_format: 'border-purple-400', example: 'border-amber-400' }

export function VisualPromptBuilderPage() {
  const { t } = useTranslation()
  const prompts = useVisualPromptStore((s) => s.prompts)
  const selectedPromptId = useVisualPromptStore((s) => s.selectedPromptId)
  const hydrate = useVisualPromptStore((s) => s.hydrate)
  const createPrompt = useVisualPromptStore((s) => s.createPrompt)
  const deletePrompt = useVisualPromptStore((s) => s.deletePrompt)
  const addBlock = useVisualPromptStore((s) => s.addBlock)
  const updateBlock = useVisualPromptStore((s) => s.updateBlock)
  const removeBlock = useVisualPromptStore((s) => s.removeBlock)
  const setSelectedPromptId = useVisualPromptStore((s) => s.setSelectedPromptId)

  useEffect(() => { hydrate() }, [hydrate])

  const selected = prompts.find((p) => p.id === selectedPromptId)
  const blockTypes: PromptBlockType[] = ['instruction', 'context', 'constraint', 'output_format', 'example']

  const handleCopy = () => {
    if (selected?.generatedPrompt) navigator.clipboard.writeText(selected.generatedPrompt)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2"><Wand2 className="w-5 h-5 text-primary" />{t('visualPrompt.title')}</h1>
        <button onClick={() => createPrompt(t('visualPrompt.untitled'))} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm"><Plus className="w-4 h-4" />{t('visualPrompt.create')}</button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 border-r border-border overflow-y-auto">
          {prompts.map((p) => (
            <div key={p.id} onClick={() => setSelectedPromptId(p.id)} className={`p-3 border-b border-border cursor-pointer hover:bg-surface-secondary ${p.id === selectedPromptId ? 'bg-surface-secondary' : ''}`}>
              <p className="text-sm text-text-primary truncate">{p.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-surface-tertiary rounded-full h-1.5"><div className="bg-primary rounded-full h-1.5" style={{ width: `${p.qualityScore}%` }} /></div>
                <span className="text-[10px] text-text-tertiary">{p.qualityScore}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 flex overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">{t('visualPrompt.selectPrompt')}</div>
          ) : (
            <>
              {/* Block editor */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-text-primary">{selected.title}</h2>
                  <button onClick={() => deletePrompt(selected.id)} className="p-1.5 rounded hover:bg-red-500/10"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {blockTypes.map((type) => { const Icon = BLOCK_ICONS[type]; return (
                    <button key={type} onClick={() => addBlock(selected.id, type, '')} className="flex items-center gap-1 px-2 py-1 text-xs bg-surface-secondary rounded hover:bg-surface-tertiary"><Icon className="w-3 h-3" />{type.replace('_', ' ')}</button>
                  )})}
                </div>
                <div className="space-y-3">
                  {selected.blocks.map((block) => { const Icon = BLOCK_ICONS[block.type]; return (
                    <div key={block.id} className={`border-l-4 ${BLOCK_COLORS[block.type]} bg-surface p-3 rounded-r-lg`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-text-secondary"><Icon className="w-3.5 h-3.5" />{block.type.replace('_', ' ')}</span>
                        <button onClick={() => removeBlock(selected.id, block.id)} className="p-0.5 rounded hover:bg-red-500/10"><Trash2 className="w-3 h-3 text-red-400" /></button>
                      </div>
                      <textarea value={block.content} onChange={(e) => updateBlock(selected.id, block.id, e.target.value)} className="w-full px-2 py-1.5 text-sm rounded bg-surface-secondary border border-border resize-none" rows={3} placeholder={`Enter ${block.type.replace('_', ' ')}...`} />
                    </div>
                  )})}
                </div>
              </div>
              {/* Preview */}
              <div className="w-80 border-l border-border p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-text-primary">{t('visualPrompt.preview')}</h3>
                  <button onClick={handleCopy} className="p-1 rounded hover:bg-surface-tertiary"><Copy className="w-3.5 h-3.5 text-text-secondary" /></button>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-text-secondary">{t('visualPrompt.quality')}:</span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-2"><div className={`rounded-full h-2 ${selected.qualityScore >= 70 ? 'bg-green-500' : selected.qualityScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${selected.qualityScore}%` }} /></div>
                  <span className="text-xs font-medium text-text-primary">{selected.qualityScore}%</span>
                </div>
                <pre className="text-xs text-text-secondary whitespace-pre-wrap bg-surface-secondary p-3 rounded-lg">{selected.generatedPrompt || t('visualPrompt.emptyPreview')}</pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
