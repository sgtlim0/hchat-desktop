import { memo, useState, useCallback, useRef, useEffect } from 'react'

interface CitationMeta {
  index: number
  chunkId: string
  page: number
  snippet: string
}

export const CitationBadge = memo(function CitationBadge({ citation }: { citation: CitationMeta }) {
  const [showPopup, setShowPopup] = useState(false)
  const badgeRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const handleToggle = useCallback(() => setShowPopup((p) => !p), [])

  useEffect(() => {
    if (!showPopup) return
    function handleClickOutside(e: MouseEvent) {
      if (
        badgeRef.current && !badgeRef.current.contains(e.target as Node) &&
        popupRef.current && !popupRef.current.contains(e.target as Node)
      ) {
        setShowPopup(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPopup])

  return (
    <span className="relative inline-block">
      <button
        ref={badgeRef}
        onClick={handleToggle}
        className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-primary/15 text-primary rounded-full hover:bg-primary/25 transition-colors cursor-pointer align-super mx-0.5"
        aria-label={`Source ${citation.index} - Page ${citation.page}`}
      >
        {citation.index}
      </button>
      {showPopup && (
        <div
          ref={popupRef}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 bg-surface border border-border rounded-lg shadow-lg p-3 text-xs text-text-primary"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-primary/15 text-primary rounded-full text-[10px] font-bold">
              {citation.index}
            </span>
            <span className="font-medium text-text-secondary">Page {citation.page}</span>
          </div>
          <p className="text-text-secondary leading-relaxed border-l-2 border-primary/30 pl-2">
            {citation.snippet}
          </p>
        </div>
      )}
    </span>
  )
})
