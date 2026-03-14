import { extractPageContent, extractPageIntelligence } from './page-extractor'
import { setupFloatingButton } from './floating-button'

chrome.runtime.onMessage.addListener(
  (
    message: { type: string },
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

    return true
  },
)

setupFloatingButton()
