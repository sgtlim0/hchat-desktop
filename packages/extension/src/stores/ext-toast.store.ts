import { create } from 'zustand'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  createdAt: number
}

interface ExtToastState {
  toasts: Toast[]
  addToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
}

export const useExtToastStore = create<ExtToastState>((set) => ({
  toasts: [],

  addToast: (type, message, duration = 3000) => {
    const id = crypto.randomUUID()
    const toast: Toast = { id, type, message, createdAt: Date.now() }

    set(state => ({ toasts: [...state.toasts, toast] }))

    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, duration)
  },

  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },
}))
