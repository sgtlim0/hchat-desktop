import { Sparkles } from 'lucide-react'

interface AiBlockProps {
  text: string
  label?: string
}

export function AiBlock({ text, label = 'AI 분석' }: AiBlockProps) {
  return (
    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 mt-3">
      <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-blue-400 uppercase mb-3">
        <Sparkles size={12} />
        {label}
      </div>
      <div className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap prose-sm">
        {text.split('\n').map((line, i) => {
          if (line.startsWith('## ')) {
            return <h3 key={i} className="text-[13px] font-bold text-[var(--text-primary)] mt-3 mb-1">{line.slice(3)}</h3>
          }
          if (line.startsWith('- ')) {
            return <p key={i} className="text-[13px] text-[var(--text-secondary)] ml-3 my-0.5">{line}</p>
          }
          return line ? <p key={i} className="text-[13px] text-[var(--text-secondary)] my-0.5">{line}</p> : <br key={i} />
        })}
      </div>
    </div>
  )
}
