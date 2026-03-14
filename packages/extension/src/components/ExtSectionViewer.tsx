import { ChevronRight, Check } from 'lucide-react'
import type { Section } from '@ext/shared/types'

interface ExtSectionViewerProps {
  readonly sections: ReadonlyArray<Section>
  readonly selectedIndices: ReadonlyArray<number>
  readonly onToggle: (index: number) => void
}

export function ExtSectionViewer({ sections, selectedIndices, onToggle }: ExtSectionViewerProps) {
  if (sections.length === 0) {
    return (
      <p className="text-[10px] text-[var(--text-tertiary)] py-2">No sections found</p>
    )
  }

  return (
    <div className="space-y-0.5">
      {sections.map((section, idx) => (
        <SectionItem
          key={idx}
          section={section}
          index={idx}
          isSelected={selectedIndices.includes(idx)}
          onToggle={onToggle}
          depth={0}
        />
      ))}
    </div>
  )
}

function SectionItem({
  section,
  index,
  isSelected,
  onToggle,
  depth,
}: {
  section: Section
  index: number
  isSelected: boolean
  onToggle: (index: number) => void
  depth: number
}) {
  const indent = depth * 12

  return (
    <div>
      <button
        onClick={() => onToggle(index)}
        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left transition-colors hover:bg-[var(--bg-hover)] ${
          isSelected ? 'bg-[var(--primary)]/5' : ''
        }`}
        style={{ paddingLeft: `${8 + indent}px` }}
      >
        <div
          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
            isSelected
              ? 'bg-[var(--primary)] border-[var(--primary)]'
              : 'border-[var(--border)]'
          }`}
        >
          {isSelected && <Check size={9} className="text-white" strokeWidth={3} />}
        </div>

        {section.children.length > 0 && (
          <ChevronRight size={10} className="text-[var(--text-tertiary)] shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-[var(--text-primary)] truncate">
            {section.heading || '(untitled section)'}
          </p>
          {section.content && (
            <p className="text-[9px] text-[var(--text-tertiary)] truncate">
              {section.content.slice(0, 80)}
            </p>
          )}
        </div>

        <span className="text-[8px] text-[var(--text-tertiary)] shrink-0">
          H{section.level || '?'}
        </span>
      </button>

      {section.children.length > 0 && (
        <div className="ml-1">
          {section.children.map((child, cIdx) => (
            <SectionItem
              key={cIdx}
              section={child}
              index={index * 100 + cIdx + 1}
              isSelected={isSelected}
              onToggle={() => onToggle(index)}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
