interface OcrWorker {
  recognize: (image: File) => Promise<{ data: { text: string } }>
  terminate: () => Promise<unknown>
}

let worker: OcrWorker | null = null

export type OcrLang = 'kor+eng' | 'eng' | 'jpn+eng' | 'chi_sim+eng'

export async function initOcrWorker(langs: OcrLang = 'kor+eng'): Promise<void> {
  if (worker) {
    await worker.terminate()
    worker = null
  }
  const { createWorker } = await import('tesseract.js')
  worker = await createWorker(langs)
}

export async function recognizeImage(
  imageFile: File,
  _onProgress?: (progress: number) => void,
): Promise<string> {
  if (!worker) await initOcrWorker()
  const result = await worker!.recognize(imageFile)
  return result.data.text
}

export async function terminateWorker(): Promise<void> {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}

export async function recognizeBatch(
  files: File[],
  onFileProgress: (fileIndex: number, progress: number) => void,
  onFileComplete: (fileIndex: number, text: string) => void,
): Promise<string[]> {
  const results: string[] = []
  for (let i = 0; i < files.length; i++) {
    const text = await recognizeImage(files[i], (p) => onFileProgress(i, p))
    results.push(text)
    onFileComplete(i, text)
  }
  return results
}
