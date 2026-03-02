import { useToastStore } from '@/entities/toast/toast.store'
import { useTranslation } from '@/shared/i18n'
import { useEffect, useState } from 'react'

export function ToastContainer() {
  const { t } = useTranslation()
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const exitingSet = new Set(exitingIds)
    let changed = false

    toasts.forEach((toast) => {
      if (exitingSet.has(toast.id)) {
        exitingSet.delete(toast.id)
        changed = true
      }
    })

    if (changed) {
      setExitingIds(exitingSet)
    }
  }, [toasts, exitingIds])

  const handleRemove = (id: string) => {
    setExitingIds((prev) => new Set(prev).add(id))
    setTimeout(() => {
      removeToast(id)
    }, 200)
  }

  const getBorderColor = (type: 'success' | 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return 'border-l-[#22C55E]'
      case 'error':
        return 'border-l-[#DC2626]'
      case 'warning':
        return 'border-l-[#D97706]'
      case 'info':
        return 'border-l-[#3478FE]'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const isExiting = exitingIds.has(toast.id)
        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              bg-card border-l-4 ${getBorderColor(toast.type)}
              rounded-lg shadow-lg
              px-4 py-3 pr-10
              max-w-sm
              transition-all duration-200 ease-out
              ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0 animate-slide-in'}
            `}
            style={{
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            <p className="text-sm text-text-primary pr-2">{toast.message}</p>
            <button
              onClick={() => handleRemove(toast.id)}
              className="absolute top-2 right-2 text-text-secondary hover:text-text-primary transition-colors p-1"
              aria-label={t('toast.close')}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
