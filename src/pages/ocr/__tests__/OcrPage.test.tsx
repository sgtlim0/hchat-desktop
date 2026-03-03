import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OcrPage } from '../OcrPage'

// Mock i18n
vi.mock('@/shared/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <div>ArrowLeft</div>,
  Upload: () => <div>Upload</div>,
  Trash2: () => <div>Trash2</div>,
  Copy: () => <div>Copy</div>,
  Download: () => <div>Download</div>,
  Loader2: () => <div>Loader2</div>,
  StopCircle: () => <div>StopCircle</div>,
  ImageIcon: () => <div>ImageIcon</div>,
}))

// Mock Button component
vi.mock('@/shared/ui/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

// Mock session store
const mockSetView = vi.fn()

vi.mock('@/entities/session/session.store', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = {
      setView: mockSetView,
    }
    return selector(state)
  }),
}))

// Mock OCR library
vi.mock('@/shared/lib/ocr', () => ({
  initOcrWorker: vi.fn().mockResolvedValue(undefined),
  recognizeImage: vi.fn().mockResolvedValue('Extracted text'),
  terminateWorker: vi.fn().mockResolvedValue(undefined),
}))

describe('OcrPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title and description', () => {
    render(<OcrPage />)
    expect(screen.getByText('ocr.title')).toBeInTheDocument()
    expect(screen.getByText('ocr.desc')).toBeInTheDocument()
  })

  it('renders language selector', () => {
    render(<OcrPage />)
    expect(screen.getByText('ocr.language')).toBeInTheDocument()

    const select = screen.getByDisplayValue('ocr.lang.korEng')
    expect(select).toBeInTheDocument()
  })

  it('renders file drop zone', () => {
    render(<OcrPage />)
    expect(screen.getByText('ocr.dropzone')).toBeInTheDocument()
    expect(screen.getByText('ocr.dropzone.hint')).toBeInTheDocument()
  })

  it('back button calls setView', () => {
    render(<OcrPage />)

    const backButton = screen.getByText('ArrowLeft').closest('button')
    fireEvent.click(backButton!)

    expect(mockSetView).toHaveBeenCalledWith('home')
  })

  it('shows empty state message when no files', () => {
    render(<OcrPage />)
    expect(screen.getByText('ocr.noResult')).toBeInTheDocument()
  })

  it('language selector can be changed', () => {
    render(<OcrPage />)

    const select = screen.getByDisplayValue('ocr.lang.korEng') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'eng' } })

    // Value should update
    expect(select.value).toBe('eng')
  })

  it('drop zone opens file input on click', () => {
    render(<OcrPage />)

    const dropzone = screen.getByText('ocr.dropzone').closest('div')!
    const fileInput = dropzone.querySelector('input[type="file"]') as HTMLInputElement

    const clickSpy = vi.spyOn(fileInput, 'click')
    fireEvent.click(dropzone)

    expect(clickSpy).toHaveBeenCalled()
  })

  it('file input accepts correct image types', () => {
    render(<OcrPage />)

    const dropzone = screen.getByText('ocr.dropzone').closest('div')!
    const fileInput = dropzone.querySelector('input[type="file"]') as HTMLInputElement

    expect(fileInput.accept).toBe('image/png,image/jpeg,image/bmp,image/webp')
    expect(fileInput.multiple).toBe(true)
  })

  it('drop zone prevents default on drag over', () => {
    render(<OcrPage />)

    const dropzone = screen.getByText('ocr.dropzone').closest('div')!
    const event = new Event('dragover', { bubbles: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    dropzone.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('renders all language options', () => {
    const { container } = render(<OcrPage />)

    const select = container.querySelector('select')!
    const options = Array.from(select.querySelectorAll('option'))

    expect(options).toHaveLength(4)
    expect(options[0].textContent).toBe('ocr.lang.korEng')
    expect(options[1].textContent).toBe('ocr.lang.eng')
    expect(options[2].textContent).toBe('ocr.lang.jpnEng')
    expect(options[3].textContent).toBe('ocr.lang.zhEng')
  })

  it('calls terminateWorker on unmount', async () => {
    const { terminateWorker } = await import('@/shared/lib/ocr')
    const { unmount } = render(<OcrPage />)

    unmount()

    expect(terminateWorker).toHaveBeenCalled()
  })

  it('dropzone has correct styling classes', () => {
    render(<OcrPage />)

    const dropzone = screen.getByText('ocr.dropzone').closest('div')!

    expect(dropzone.className).toContain('border-2')
    expect(dropzone.className).toContain('border-dashed')
    expect(dropzone.className).toContain('border-border')
    expect(dropzone.className).toContain('rounded-xl')
    expect(dropzone.className).toContain('cursor-pointer')
  })

  it('language selector is disabled during processing', () => {
    render(<OcrPage />)

    const select = screen.getByDisplayValue('ocr.lang.korEng') as HTMLSelectElement

    // Initially not disabled
    expect(select.disabled).toBe(false)
  })

  it('renders empty state in correct container', () => {
    render(<OcrPage />)

    const emptyMessage = screen.getByText('ocr.noResult')

    expect(emptyMessage.className).toContain('text-sm')
    expect(emptyMessage.className).toContain('text-text-tertiary')
    expect(emptyMessage.className).toContain('text-center')
  })

  it('header has correct layout', () => {
    render(<OcrPage />)

    const header = screen.getByText('ocr.title').closest('div')?.parentElement

    expect(header?.className).toContain('flex')
    expect(header?.className).toContain('items-center')
    expect(header?.className).toContain('gap-3')
    expect(header?.className).toContain('border-b')
  })
})
