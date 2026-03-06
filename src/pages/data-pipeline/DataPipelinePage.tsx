import { useEffect } from 'react'
import { Plus, Trash2, Play, GitBranch, Filter, SortAsc, BarChart3, Database, Download } from 'lucide-react'
import { useDataPipelineStore } from '@/entities/data-pipeline/data-pipeline.store'
import { useTranslation } from '@/shared/i18n'
import type { PipelineBlockType } from '@/shared/types'

const BLOCK_ICONS: Record<PipelineBlockType, typeof Database> = { source: Database, filter: Filter, sort: SortAsc, aggregate: BarChart3, pivot: GitBranch, output: Download }
const BLOCK_COLORS: Record<PipelineBlockType, string> = { source: 'border-blue-400', filter: 'border-amber-400', sort: 'border-green-400', aggregate: 'border-purple-400', pivot: 'border-pink-400', output: 'border-cyan-400' }

export function DataPipelinePage() {
  const { t } = useTranslation()
  const pipelines = useDataPipelineStore((s) => s.pipelines)
  const selectedPipelineId = useDataPipelineStore((s) => s.selectedPipelineId)
  const hydrate = useDataPipelineStore((s) => s.hydrate)
  const createPipeline = useDataPipelineStore((s) => s.createPipeline)
  const deletePipeline = useDataPipelineStore((s) => s.deletePipeline)
  const addBlock = useDataPipelineStore((s) => s.addBlock)
  const removeBlock = useDataPipelineStore((s) => s.removeBlock)
  const runPipeline = useDataPipelineStore((s) => s.runPipeline)
  const setSelectedPipelineId = useDataPipelineStore((s) => s.setSelectedPipelineId)

  useEffect(() => { hydrate() }, [hydrate])

  const selected = pipelines.find((p) => p.id === selectedPipelineId)
  const blockTypes: PipelineBlockType[] = ['source', 'filter', 'sort', 'aggregate', 'pivot', 'output']

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary" />{t('dataPipeline.title')}
        </h1>
        <button onClick={() => createPipeline(t('dataPipeline.untitled'))} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm"><Plus className="w-4 h-4" />{t('dataPipeline.create')}</button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 border-r border-border overflow-y-auto">
          {pipelines.map((p) => (
            <div key={p.id} onClick={() => setSelectedPipelineId(p.id)} className={`p-3 border-b border-border cursor-pointer hover:bg-surface-secondary ${p.id === selectedPipelineId ? 'bg-surface-secondary' : ''}`}>
              <p className="text-sm text-text-primary truncate">{p.name}</p>
              <p className="text-[10px] text-text-tertiary">{p.blocks.length} blocks · {p.status}</p>
            </div>
          ))}
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-text-tertiary text-sm">{t('dataPipeline.selectPipeline')}</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-text-primary">{selected.name}</h2>
                <div className="flex gap-1.5">
                  <button onClick={() => runPipeline(selected.id)} disabled={selected.status === 'running'} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm disabled:opacity-50"><Play className="w-4 h-4" />{t('dataPipeline.run')}</button>
                  <button onClick={() => deletePipeline(selected.id)} className="p-1.5 rounded-lg hover:bg-red-500/10"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {blockTypes.map((type) => { const Icon = BLOCK_ICONS[type]; return (
                  <button key={type} onClick={() => addBlock(selected.id, type, type)} className="flex items-center gap-1 px-2 py-1 text-xs bg-surface-secondary rounded hover:bg-surface-tertiary"><Icon className="w-3 h-3" />{type}</button>
                )})}
              </div>
              <div className="space-y-2">
                {selected.blocks.map((block, i) => { const Icon = BLOCK_ICONS[block.type]; return (
                  <div key={block.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 ${BLOCK_COLORS[block.type]} bg-surface`}>
                    <span className="text-xs text-text-tertiary w-5">{i + 1}</span>
                    <Icon className="w-4 h-4 text-text-secondary" />
                    <span className="text-sm text-text-primary flex-1">{block.label}</span>
                    <button onClick={() => removeBlock(selected.id, block.id)} className="p-1 hover:bg-red-500/10 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                )})}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
