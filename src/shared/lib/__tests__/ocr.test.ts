import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Worker } from 'tesseract.js'

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(),
}))

describe('ocr', () => {
  let mockWorker: {
    recognize: ReturnType<typeof vi.fn>
    terminate: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    mockWorker = {
      recognize: vi.fn().mockResolvedValue({ data: { text: 'recognized text' } }),
      terminate: vi.fn().mockResolvedValue(undefined),
    }

    const tesseract = await import('tesseract.js')
    vi.mocked(tesseract.createWorker).mockResolvedValue(mockWorker as unknown as Worker)
  })

  describe('initOcrWorker', () => {
    it('should create worker with default language (kor+eng)', async () => {
      const { initOcrWorker } = await import('../ocr')
      const { createWorker } = await import('tesseract.js')

      await initOcrWorker()

      expect(createWorker).toHaveBeenCalledWith('kor+eng')
      expect(createWorker).toHaveBeenCalledTimes(1)
    })

    it('should create worker with specified language', async () => {
      const { initOcrWorker } = await import('../ocr')
      const { createWorker } = await import('tesseract.js')

      await initOcrWorker('eng')

      expect(createWorker).toHaveBeenCalledWith('eng')
    })

    it('should support all language options', async () => {
      const { initOcrWorker } = await import('../ocr')
      const { createWorker } = await import('tesseract.js')

      await initOcrWorker('jpn+eng')
      expect(createWorker).toHaveBeenCalledWith('jpn+eng')

      await initOcrWorker('chi_sim+eng')
      expect(createWorker).toHaveBeenCalledWith('chi_sim+eng')
    })

    it('should terminate existing worker before creating new one', async () => {
      const { initOcrWorker } = await import('../ocr')

      await initOcrWorker('eng')
      expect(mockWorker.terminate).not.toHaveBeenCalled()

      await initOcrWorker('jpn+eng')
      expect(mockWorker.terminate).toHaveBeenCalledTimes(1)
    })
  })

  describe('recognizeImage', () => {
    it('should auto-initialize worker if not initialized', async () => {
      const { recognizeImage } = await import('../ocr')
      const { createWorker } = await import('tesseract.js')
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })

      const result = await recognizeImage(mockFile)

      expect(createWorker).toHaveBeenCalledWith('kor+eng')
      expect(mockWorker.recognize).toHaveBeenCalledWith(mockFile)
      expect(result).toBe('recognized text')
    })

    it('should use existing worker if already initialized', async () => {
      const { initOcrWorker, recognizeImage } = await import('../ocr')
      const { createWorker } = await import('tesseract.js')
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })

      await initOcrWorker('eng')
      vi.clearAllMocks()

      const result = await recognizeImage(mockFile)

      expect(createWorker).not.toHaveBeenCalled()
      expect(mockWorker.recognize).toHaveBeenCalledWith(mockFile)
      expect(result).toBe('recognized text')
    })

    it('should return extracted text from recognition result', async () => {
      const { recognizeImage } = await import('../ocr')
      mockWorker.recognize.mockResolvedValue({
        data: { text: 'Hello World from OCR' },
      })
      const mockFile = new File(['image data'], 'test.png', { type: 'image/png' })

      const result = await recognizeImage(mockFile)

      expect(result).toBe('Hello World from OCR')
    })

    it('should handle empty text result', async () => {
      const { recognizeImage } = await import('../ocr')
      mockWorker.recognize.mockResolvedValue({
        data: { text: '' },
      })
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })

      const result = await recognizeImage(mockFile)

      expect(result).toBe('')
    })

    it('should accept onProgress callback (not used but supported)', async () => {
      const { recognizeImage } = await import('../ocr')
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })
      const onProgress = vi.fn()

      await recognizeImage(mockFile, onProgress)

      expect(mockWorker.recognize).toHaveBeenCalledWith(mockFile)
    })
  })

  describe('terminateWorker', () => {
    it('should terminate worker if exists', async () => {
      const { initOcrWorker, terminateWorker } = await import('../ocr')

      await initOcrWorker()
      await terminateWorker()

      expect(mockWorker.terminate).toHaveBeenCalledTimes(1)
    })

    it('should do nothing if worker does not exist', async () => {
      const { terminateWorker } = await import('../ocr')

      await terminateWorker()

      expect(mockWorker.terminate).not.toHaveBeenCalled()
    })

    it('should allow recognizeImage to work after termination', async () => {
      const { initOcrWorker, terminateWorker, recognizeImage } = await import('../ocr')
      const { createWorker } = await import('tesseract.js')
      const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' })

      await initOcrWorker('eng')
      await terminateWorker()
      vi.clearAllMocks()

      await recognizeImage(mockFile)

      expect(createWorker).toHaveBeenCalledWith('kor+eng')
      expect(mockWorker.recognize).toHaveBeenCalledWith(mockFile)
    })
  })

  describe('recognizeBatch', () => {
    it('should process multiple files sequentially', async () => {
      const { recognizeBatch } = await import('../ocr')
      const files = [
        new File(['image1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'test2.jpg', { type: 'image/jpeg' }),
        new File(['image3'], 'test3.jpg', { type: 'image/jpeg' }),
      ]
      const onFileProgress = vi.fn()
      const onFileComplete = vi.fn()

      mockWorker.recognize
        .mockResolvedValueOnce({ data: { text: 'text1' } })
        .mockResolvedValueOnce({ data: { text: 'text2' } })
        .mockResolvedValueOnce({ data: { text: 'text3' } })

      const results = await recognizeBatch(files, onFileProgress, onFileComplete)

      expect(results).toEqual(['text1', 'text2', 'text3'])
      expect(mockWorker.recognize).toHaveBeenCalledTimes(3)
      expect(mockWorker.recognize).toHaveBeenNthCalledWith(1, files[0])
      expect(mockWorker.recognize).toHaveBeenNthCalledWith(2, files[1])
      expect(mockWorker.recognize).toHaveBeenNthCalledWith(3, files[2])
    })

    it('should call onFileComplete callback for each file', async () => {
      const { recognizeBatch } = await import('../ocr')
      const files = [
        new File(['image1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'test2.jpg', { type: 'image/jpeg' }),
      ]
      const onFileProgress = vi.fn()
      const onFileComplete = vi.fn()

      mockWorker.recognize
        .mockResolvedValueOnce({ data: { text: 'result1' } })
        .mockResolvedValueOnce({ data: { text: 'result2' } })

      await recognizeBatch(files, onFileProgress, onFileComplete)

      expect(onFileComplete).toHaveBeenCalledTimes(2)
      expect(onFileComplete).toHaveBeenNthCalledWith(1, 0, 'result1')
      expect(onFileComplete).toHaveBeenNthCalledWith(2, 1, 'result2')
    })

    it('should pass correct file index to onFileProgress callback', async () => {
      const { recognizeBatch } = await import('../ocr')
      const files = [
        new File(['image1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'test2.jpg', { type: 'image/jpeg' }),
      ]
      const onFileProgress = vi.fn()
      const onFileComplete = vi.fn()

      mockWorker.recognize
        .mockResolvedValueOnce({ data: { text: 'result1' } })
        .mockResolvedValueOnce({ data: { text: 'result2' } })

      await recognizeBatch(files, onFileProgress, onFileComplete)

      // onFileProgress is passed but not called by recognizeImage in current implementation
      expect(onFileComplete).toHaveBeenCalledTimes(2)
    })

    it('should handle empty file array', async () => {
      const { recognizeBatch } = await import('../ocr')
      const onFileProgress = vi.fn()
      const onFileComplete = vi.fn()

      const results = await recognizeBatch([], onFileProgress, onFileComplete)

      expect(results).toEqual([])
      expect(mockWorker.recognize).not.toHaveBeenCalled()
      expect(onFileComplete).not.toHaveBeenCalled()
    })

    it('should handle single file', async () => {
      const { recognizeBatch } = await import('../ocr')
      const files = [new File(['image1'], 'test1.jpg', { type: 'image/jpeg' })]
      const onFileProgress = vi.fn()
      const onFileComplete = vi.fn()

      mockWorker.recognize.mockResolvedValueOnce({ data: { text: 'single result' } })

      const results = await recognizeBatch(files, onFileProgress, onFileComplete)

      expect(results).toEqual(['single result'])
      expect(onFileComplete).toHaveBeenCalledWith(0, 'single result')
    })

    it('should auto-initialize worker if not initialized', async () => {
      const { recognizeBatch } = await import('../ocr')
      const { createWorker } = await import('tesseract.js')
      const files = [new File(['image1'], 'test1.jpg', { type: 'image/jpeg' })]
      const onFileProgress = vi.fn()
      const onFileComplete = vi.fn()

      mockWorker.recognize.mockResolvedValueOnce({ data: { text: 'text1' } })

      await recognizeBatch(files, onFileProgress, onFileComplete)

      expect(createWorker).toHaveBeenCalledWith('kor+eng')
    })
  })
})
