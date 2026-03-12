interface PageContextBannerProps {
  title: string
  url: string
  isLoading?: boolean
}

export function PageContextBanner({ title, url, isLoading }: PageContextBannerProps) {
  if (isLoading) {
    return (
      <div className="border-l-4 border-l-blue-500 bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    )
  }

  return (
    <div className="border-l-4 border-l-blue-500 bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
        {title}
      </p>
      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
        {url}
      </p>
    </div>
  )
}
