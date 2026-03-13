import type { FileInfo, AnalysisMode, AnalysisResult, MessageType } from '../shared/types'
import { initFileInput } from './components/file-input'
import { initFilePreview } from './components/file-preview'
import { initModeSelector } from './components/mode-selector'
import { initPromptInput } from './components/prompt-input'
import { initResultPanel } from './components/result-panel'
import { initHistoryList } from './components/history-list'

// --- State ---
interface AppState {
  readonly fileInfo: FileInfo | null
  readonly mode: AnalysisMode
  readonly isStreaming: boolean
  readonly history: readonly AnalysisResult[]
}

const STORAGE_KEY = 'hchat-analysis-history'

function loadHistory(): AnalysisResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(history: readonly AnalysisResult[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // storage full — silently ignore
  }
}

let state: AppState = {
  fileInfo: null,
  mode: 'summary',
  isStreaming: false,
  history: loadHistory(),
}

function updateState(partial: Partial<AppState>): void {
  state = { ...state, ...partial }
}

// --- DOM Refs ---
function $(id: string): HTMLElement {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Element #${id} not found`)
  return el
}

// --- Component Handles ---
let modeSelectorHandle: ReturnType<typeof initModeSelector> | null = null
let promptInputHandle: ReturnType<typeof initPromptInput> | null = null
let resultPanelHandle: ReturnType<typeof initResultPanel> | null = null
let historyListHandle: ReturnType<typeof initHistoryList> | null = null

// --- Visibility Helpers ---
function showSection(id: string): void {
  $(id).style.display = ''
}

function hideSection(id: string): void {
  $(id).style.display = 'none'
}

// --- Flow: File Selected ---
function onFileSelected(fileInfo: FileInfo): void {
  updateState({ fileInfo })

  // Hide file input, show preview + mode + prompt
  hideSection('file-input-area')
  showSection('file-preview-area')
  showSection('mode-selector-area')
  showSection('prompt-input-area')
  hideSection('result-area')

  initFilePreview($('file-preview-area'), fileInfo, onReset)

  if (!modeSelectorHandle) {
    modeSelectorHandle = initModeSelector($('mode-selector-area'), onModeSelected, state.mode)
  }

  if (!promptInputHandle) {
    promptInputHandle = initPromptInput($('prompt-input-area'), state.mode, onAnalyze)
  } else {
    promptInputHandle.reset()
  }
}

// --- Flow: Web Page Extract ---
function onWebExtract(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0]
    if (!tab?.id) return

    chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PAGE' as MessageType }, (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        alert('웹페이지 추출에 실패했습니다. 페이지를 새로고침 후 다시 시도하세요.')
        return
      }
      const fileInfo: FileInfo = {
        name: response.title || tab.title || '웹페이지',
        size: new Blob([response.content]).size,
        type: 'WEB',
        content: response.content,
        extension: '.html',
      }
      onFileSelected(fileInfo)
    })
  })
}

// --- Flow: Mode Selected ---
function onModeSelected(mode: AnalysisMode): void {
  updateState({ mode })
  promptInputHandle?.setMode(mode)
}

// --- Flow: Reset (pick another file) ---
function onReset(): void {
  updateState({ fileInfo: null })

  showSection('file-input-area')
  hideSection('file-preview-area')
  hideSection('mode-selector-area')
  hideSection('prompt-input-area')
  hideSection('result-area')

  resultPanelHandle?.clear()
  promptInputHandle?.reset()
}

// --- Flow: Analyze (start streaming) ---
function onAnalyze(userPrompt: string): void {
  if (!state.fileInfo || state.isStreaming) return

  updateState({ isStreaming: true })
  showSection('result-area')

  if (!resultPanelHandle) {
    resultPanelHandle = initResultPanel($('result-area'), () => onAnalyze(userPrompt))
  } else {
    resultPanelHandle.clear()
  }

  promptInputHandle?.setLoading(true)

  // Connect to background via port for streaming
  const port = chrome.runtime.connect({ name: 'sidepanel-stream' })

  let fullText = ''

  port.onMessage.addListener((msg: { type: string; text?: string; error?: string }) => {
    switch (msg.type) {
      case 'stream-chunk':
        if (msg.text) {
          fullText += msg.text
          resultPanelHandle?.appendText(msg.text)
        }
        break

      case 'stream-done':
        resultPanelHandle?.finalize()
        promptInputHandle?.setLoading(false)
        updateState({ isStreaming: false })
        saveAnalysisResult(fullText)
        port.disconnect()
        break

      case 'stream-error':
        resultPanelHandle?.finalize()
        promptInputHandle?.setLoading(false)
        updateState({ isStreaming: false })
        if (!fullText) {
          resultPanelHandle?.setContent(`**오류:** ${msg.error || '분석 중 오류가 발생했습니다'}`)
        }
        port.disconnect()
        break
    }
  })

  port.onDisconnect.addListener(() => {
    if (state.isStreaming) {
      resultPanelHandle?.finalize()
      promptInputHandle?.setLoading(false)
      updateState({ isStreaming: false })
    }
  })

  // Send analysis request
  port.postMessage({
    type: 'analyze',
    fileContent: state.fileInfo.content,
    fileName: state.fileInfo.name,
    mode: state.mode,
    userPrompt,
  })
}

// --- Save to History ---
function saveAnalysisResult(resultText: string): void {
  if (!state.fileInfo || !resultText.trim()) return

  const result: AnalysisResult = {
    id: crypto.randomUUID(),
    fileName: state.fileInfo.name,
    fileType: state.fileInfo.type,
    mode: state.mode,
    resultText,
    timestamp: Date.now(),
  }

  const newHistory = [result, ...state.history].slice(0, 50) // keep max 50
  updateState({ history: newHistory })
  saveHistory(newHistory)
  historyListHandle?.update(newHistory)
}

// --- History Panel ---
function openHistory(): void {
  const panel = $('history-panel')
  panel.style.display = 'flex'

  historyListHandle = initHistoryList(
    $('history-list-area'),
    state.history,
    onHistorySelect,
    onHistoryClear,
  )
}

function closeHistory(): void {
  $('history-panel').style.display = 'none'
}

function onHistorySelect(result: AnalysisResult): void {
  closeHistory()

  // Restore result to view
  const fileInfo: FileInfo = {
    name: result.fileName,
    size: 0,
    type: result.fileType,
    content: '',
    extension: '',
  }
  updateState({ fileInfo, mode: result.mode })

  hideSection('file-input-area')
  showSection('file-preview-area')
  showSection('mode-selector-area')
  showSection('prompt-input-area')
  showSection('result-area')

  initFilePreview($('file-preview-area'), fileInfo, onReset)
  modeSelectorHandle?.setSelected(result.mode)
  promptInputHandle?.setMode(result.mode)

  if (!resultPanelHandle) {
    resultPanelHandle = initResultPanel($('result-area'), () => {})
  }
  resultPanelHandle.setContent(result.resultText)
}

function onHistoryClear(): void {
  updateState({ history: [] })
  saveHistory([])
  historyListHandle?.update([])
}

// --- Init ---
function init(): void {
  // File input
  initFileInput($('file-input-area'), onFileSelected, onWebExtract)

  // Header buttons
  $('btn-history').addEventListener('click', openHistory)
  $('btn-history-close').addEventListener('click', closeHistory)

  $('btn-settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage?.()
  })
}

// Boot
document.addEventListener('DOMContentLoaded', init)
