const MAX_TEXT_LENGTH = 100_000

interface ExtractedContent {
  title: string
  url: string
  textContent: string
  charCount: number
}

function extractPageContent(): ExtractedContent {
  const rawText = document.body.innerText || ''
  const truncated =
    rawText.length > MAX_TEXT_LENGTH
      ? rawText.slice(0, MAX_TEXT_LENGTH) + '\n\n[...truncated]'
      : rawText

  return {
    title: document.title,
    url: location.href,
    textContent: truncated,
    charCount: rawText.length,
  }
}

chrome.runtime.onMessage.addListener(
  (
    message: { type: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtractedContent | { error: string }) => void
  ) => {
    if (message.type === 'EXTRACT_TEXT') {
      try {
        const content = extractPageContent()
        sendResponse(content)
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : '페이지 내용을 추출하는 중 오류가 발생했습니다'
        sendResponse({ error: errorMessage })
      }
    }
    return true
  }
)
