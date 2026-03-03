import { create } from 'zustand'

export type TranslateFileStatus = 'pending' | 'extracting' | 'translating' | 'done' | 'error'
export type TranslateEngine = 'llm' | 'direct'

export interface TranslateFile {
  id: string
  name: string
  size: number
  type: string
  status: TranslateFileStatus
  progress: number
  originalText: string
  translatedText: string
  error?: string
}

interface TranslateState {
  engine: TranslateEngine
  sourceLang: string
  targetLang: string
  files: TranslateFile[]
  isProcessing: boolean

  setEngine: (engine: TranslateEngine) => void
  setSourceLang: (lang: string) => void
  setTargetLang: (lang: string) => void
  addFiles: (files: Array<{ name: string; size: number; type: string }>) => void
  removeFile: (id: string) => void
  updateFile: (id: string, updates: Partial<TranslateFile>) => void
  setProcessing: (isProcessing: boolean) => void
  clearAll: () => void
}

export const useTranslateStore = create<TranslateState>((set) => ({
  engine: 'llm',
  sourceLang: 'auto',
  targetLang: 'ko',
  files: [],
  isProcessing: false,

  setEngine: (engine) => set({ engine }),
  setSourceLang: (sourceLang) => set({ sourceLang }),
  setTargetLang: (targetLang) => set({ targetLang }),

  addFiles: (newFiles) =>
    set((state) => ({
      files: [
        ...state.files,
        ...newFiles.map((f) => ({
          id: `tf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: f.name,
          size: f.size,
          type: f.type,
          status: 'pending' as TranslateFileStatus,
          progress: 0,
          originalText: '',
          translatedText: '',
        })),
      ],
    })),

  removeFile: (id) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    })),

  updateFile: (id, updates) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),

  setProcessing: (isProcessing) => set({ isProcessing }),

  clearAll: () =>
    set({
      files: [],
      isProcessing: false,
    }),
}))
