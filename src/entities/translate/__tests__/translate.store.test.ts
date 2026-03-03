import { describe, it, expect, beforeEach } from 'vitest'
import { useTranslateStore } from '../translate.store'

function resetStore() {
  useTranslateStore.setState({
    engine: 'llm',
    sourceLang: 'auto',
    targetLang: 'ko',
    files: [],
    isProcessing: false,
  })
}

describe('useTranslateStore', () => {
  beforeEach(() => {
    resetStore()
  })

  it('starts with default state', () => {
    const state = useTranslateStore.getState()
    expect(state.engine).toBe('llm')
    expect(state.sourceLang).toBe('auto')
    expect(state.targetLang).toBe('ko')
    expect(state.files).toEqual([])
    expect(state.isProcessing).toBe(false)
  })

  describe('setEngine', () => {
    it('updates engine to direct', () => {
      useTranslateStore.getState().setEngine('direct')
      expect(useTranslateStore.getState().engine).toBe('direct')
    })

    it('updates engine to llm', () => {
      useTranslateStore.getState().setEngine('direct')
      useTranslateStore.getState().setEngine('llm')
      expect(useTranslateStore.getState().engine).toBe('llm')
    })
  })

  describe('setSourceLang / setTargetLang', () => {
    it('updates source language', () => {
      useTranslateStore.getState().setSourceLang('en')
      expect(useTranslateStore.getState().sourceLang).toBe('en')
    })

    it('updates target language', () => {
      useTranslateStore.getState().setTargetLang('en')
      expect(useTranslateStore.getState().targetLang).toBe('en')
    })
  })

  describe('addFiles', () => {
    it('adds files with pending status', () => {
      useTranslateStore.getState().addFiles([
        { name: 'test.pdf', size: 1024, type: 'application/pdf' },
        { name: 'readme.txt', size: 256, type: 'text/plain' },
      ])

      const { files } = useTranslateStore.getState()
      expect(files).toHaveLength(2)
      expect(files[0].name).toBe('test.pdf')
      expect(files[0].status).toBe('pending')
      expect(files[0].progress).toBe(0)
      expect(files[0].originalText).toBe('')
      expect(files[0].translatedText).toBe('')
      expect(files[1].name).toBe('readme.txt')
    })

    it('generates unique IDs', () => {
      useTranslateStore.getState().addFiles([
        { name: 'a.txt', size: 100, type: 'text/plain' },
      ])
      useTranslateStore.getState().addFiles([
        { name: 'b.txt', size: 200, type: 'text/plain' },
      ])

      const { files } = useTranslateStore.getState()
      expect(files[0].id).not.toBe(files[1].id)
    })

    it('preserves existing files', () => {
      useTranslateStore.getState().addFiles([
        { name: 'first.txt', size: 100, type: 'text/plain' },
      ])
      useTranslateStore.getState().addFiles([
        { name: 'second.txt', size: 200, type: 'text/plain' },
      ])

      const { files } = useTranslateStore.getState()
      expect(files).toHaveLength(2)
      expect(files[0].name).toBe('first.txt')
      expect(files[1].name).toBe('second.txt')
    })
  })

  describe('removeFile', () => {
    it('removes file by id', () => {
      useTranslateStore.getState().addFiles([
        { name: 'a.txt', size: 100, type: 'text/plain' },
        { name: 'b.txt', size: 200, type: 'text/plain' },
      ])

      const { files } = useTranslateStore.getState()
      useTranslateStore.getState().removeFile(files[0].id)

      const updated = useTranslateStore.getState().files
      expect(updated).toHaveLength(1)
      expect(updated[0].name).toBe('b.txt')
    })

    it('does nothing for non-existent id', () => {
      useTranslateStore.getState().addFiles([
        { name: 'a.txt', size: 100, type: 'text/plain' },
      ])

      useTranslateStore.getState().removeFile('nonexistent')

      expect(useTranslateStore.getState().files).toHaveLength(1)
    })
  })

  describe('updateFile', () => {
    it('updates specific file properties', () => {
      useTranslateStore.getState().addFiles([
        { name: 'test.pdf', size: 1024, type: 'application/pdf' },
      ])

      const fileId = useTranslateStore.getState().files[0].id
      useTranslateStore.getState().updateFile(fileId, {
        status: 'translating',
        progress: 50,
        originalText: 'Hello world',
      })

      const file = useTranslateStore.getState().files[0]
      expect(file.status).toBe('translating')
      expect(file.progress).toBe(50)
      expect(file.originalText).toBe('Hello world')
      expect(file.translatedText).toBe('')
    })

    it('does not affect other files', () => {
      useTranslateStore.getState().addFiles([
        { name: 'a.txt', size: 100, type: 'text/plain' },
        { name: 'b.txt', size: 200, type: 'text/plain' },
      ])

      const files = useTranslateStore.getState().files
      useTranslateStore.getState().updateFile(files[0].id, { status: 'done' })

      const updated = useTranslateStore.getState().files
      expect(updated[0].status).toBe('done')
      expect(updated[1].status).toBe('pending')
    })

    it('handles error state', () => {
      useTranslateStore.getState().addFiles([
        { name: 'test.txt', size: 100, type: 'text/plain' },
      ])

      const fileId = useTranslateStore.getState().files[0].id
      useTranslateStore.getState().updateFile(fileId, {
        status: 'error',
        error: 'Something went wrong',
      })

      const file = useTranslateStore.getState().files[0]
      expect(file.status).toBe('error')
      expect(file.error).toBe('Something went wrong')
    })
  })

  describe('setProcessing', () => {
    it('sets processing to true', () => {
      useTranslateStore.getState().setProcessing(true)
      expect(useTranslateStore.getState().isProcessing).toBe(true)
    })

    it('sets processing to false', () => {
      useTranslateStore.getState().setProcessing(true)
      useTranslateStore.getState().setProcessing(false)
      expect(useTranslateStore.getState().isProcessing).toBe(false)
    })
  })

  describe('clearAll', () => {
    it('clears files and resets processing', () => {
      useTranslateStore.getState().addFiles([
        { name: 'a.txt', size: 100, type: 'text/plain' },
      ])
      useTranslateStore.getState().setProcessing(true)

      useTranslateStore.getState().clearAll()

      const state = useTranslateStore.getState()
      expect(state.files).toEqual([])
      expect(state.isProcessing).toBe(false)
    })

    it('preserves engine and language settings', () => {
      useTranslateStore.getState().setEngine('direct')
      useTranslateStore.getState().setSourceLang('en')
      useTranslateStore.getState().setTargetLang('ja')

      useTranslateStore.getState().clearAll()

      const state = useTranslateStore.getState()
      expect(state.engine).toBe('direct')
      expect(state.sourceLang).toBe('en')
      expect(state.targetLang).toBe('ja')
    })
  })
})
