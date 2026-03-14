import { extractPageContent, extractPageIntelligence } from './page-extractor'
import { setupFloatingButton } from './floating-button'
import { detectRepeatingPatterns } from './pattern-detector'
import { buildCandidates } from './dataset-candidate'
import { focusDataset, clearHighlights } from './highlight-overlay'

chrome.runtime.onMessage.addListener(
  (
    message: { type: string; datasetIndex?: number },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    if (message.type === 'EXTRACT_PAGE_CONTENT') {
      try {
        const content = extractPageContent()
        sendResponse({ type: 'PAGE_CONTENT_RESULT', data: content })
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : '페이지 내용을 추출하는 중 오류가 발생했습니다'
        sendResponse({ error: errorMessage })
      }
    }

    if (message.type === 'EXTRACT_PAGE_INTELLIGENCE') {
      try {
        const intelligence = extractPageIntelligence()
        sendResponse({ type: 'PAGE_INTELLIGENCE_RESULT', data: intelligence })
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : '페이지 분석 중 오류가 발생했습니다'
        sendResponse({ error: errorMessage })
      }
    }

    if (message.type === 'DISCOVER_DATASETS') {
      try {
        const patterns = detectRepeatingPatterns(document.body)
        const candidates = buildCandidates(patterns)
        // Serialize candidates (remove DOM references for message passing)
        const serialized = candidates.map((c) => ({
          ...c,
          pattern: {
            parentSelector: c.pattern.parentSelector,
            fingerprint: c.pattern.fingerprint,
            count: c.pattern.count,
            density: c.pattern.density,
            fieldHints: c.pattern.fieldHints,
            avgTextLength: c.pattern.avgTextLength,
          },
        }))
        sendResponse({ type: 'DATASETS_DISCOVERED', data: serialized })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '데이터셋 탐색 중 오류가 발생했습니다'
        sendResponse({ error: errorMessage })
      }
    }

    if (message.type === 'HIGHLIGHT_DATASET') {
      try {
        const idx = message.datasetIndex ?? 0
        const patterns = detectRepeatingPatterns(document.body)
        if (idx < patterns.length) {
          focusDataset(patterns[idx].members, idx)
        }
        sendResponse({ ok: true })
      } catch {
        sendResponse({ ok: false })
      }
    }

    if (message.type === 'CLEAR_HIGHLIGHTS') {
      clearHighlights()
      sendResponse({ ok: true })
    }

    return true
  },
)

setupFloatingButton()
