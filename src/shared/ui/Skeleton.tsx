import { memo } from 'react'

export const SkeletonLine = memo(function SkeletonLine({
  width,
  height = 'h-4',
  className = '',
}: {
  width?: string
  height?: string
  className?: string
}) {
  // Check if height is a Tailwind class (starts with h-) or a CSS value
  const isHeightClass = height?.startsWith('h-')

  return (
    <div
      className={`animate-pulse bg-card rounded ${isHeightClass ? height : 'h-4'} ${width ? '' : 'w-full'} ${className}`}
      style={{
        ...(width && { width }),
        ...(!isHeightClass && height && { height })
      }}
    />
  )
})

export const SkeletonCircle = memo(function SkeletonCircle({
  size = 40,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <div
      className={`animate-pulse bg-card rounded-full flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  )
})

export const SkeletonBlock = memo(function SkeletonBlock({
  rows = 3,
  className = '',
}: {
  rows?: number
  className?: string
}) {
  const widths = ['100%', '80%', '60%']
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonLine key={i} width={widths[i % widths.length]} />
      ))}
    </div>
  )
})

export const SkeletonCard = memo(function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`flex gap-3 py-2 ${className}`}>
      <SkeletonCircle size={32} />
      <div className="flex-1">
        <SkeletonBlock rows={3} />
      </div>
    </div>
  )
})

export const SkeletonPage = memo(function SkeletonPage({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <SkeletonLine width="40%" height="24px" />
        <SkeletonLine width="60%" />
      </div>
      {/* Cards */}
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
})
