import { create } from 'zustand'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
  action?: ToastAction
  progress?: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  updateProgress: (id: string, progress: number) => void
  clearAll: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const duration = toast.duration ?? 3000
    const newToast: Toast = { ...toast, id }

    set((state) => {
      const updatedToasts = [...state.toasts, newToast]
      return { toasts: updatedToasts.slice(-5) }
    })

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  updateProgress: (id, progress) =>
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, progress: Math.min(100, Math.max(0, progress)) } : t,
      ),
    })),

  clearAll: () => set({ toasts: [] }),
}))
