import { useCallback, useRef } from 'react'

interface ResizeHandleProps {
  onResize: (width: number) => void
  panelWidth: number
}

export function ResizeHandle({ onResize, panelWidth }: ResizeHandleProps) {
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isDragging.current = true
      startX.current = e.clientX
      startWidth.current = panelWidth

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isDragging.current) return
        const delta = startX.current - ev.clientX
        onResize(startWidth.current + delta)
      }

      const handleMouseUp = () => {
        isDragging.current = false
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [onResize, panelWidth],
  )

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors flex-shrink-0"
      role="separator"
      aria-orientation="vertical"
    />
  )
}
