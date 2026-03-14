import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useExtToastStore } from '@ext/stores/toast.store'

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const

const colorMap = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300',
} as const

export function ExtToastContainer() {
  const toasts = useExtToastStore((s) => s.toasts)
  const removeToast = useExtToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-2 right-2 z-50 space-y-1.5 max-w-[350px]">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type]
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs shadow-sm animate-in slide-in-from-top-2 ${colorMap[toast.type]}`}
          >
            <Icon size={14} className="flex-shrink-0" />
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-0.5 rounded hover:bg-black/5"
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
