// Content script — runs on every page
// Extracts page text, detects selection, shows floating AI button

interface PageData {
  title: string
  url: string
  content: string
  selectedText: string
  meta: {
    description: string
    keywords: string
    ogTitle: string
  }
}

function getPageData(): PageData {
  const selectedText = window.getSelection()?.toString() || ''

  // Try to get main content area
  const mainContent = document.querySelector('main, article, [role="main"]')
  const content = (mainContent?.textContent || document.body.innerText || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 15000)

  const getMeta = (name: string): string =>
    document
      .querySelector(`meta[name="${name}"], meta[property="${name}"]`)
      ?.getAttribute('content') || ''

  return {
    title: document.title,
    url: location.href,
    content,
    selectedText,
    meta: {
      description: getMeta('description'),
      keywords: getMeta('keywords'),
      ogTitle: getMeta('og:title'),
    },
  }
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_PAGE') {
    sendResponse(getPageData())
  }
  return false
})

// Floating AI button on text selection
let floatingBtn: HTMLDivElement | null = null

function createFloatingButton(x: number, y: number): void {
  removeFloatingButton()

  floatingBtn = document.createElement('div')
  floatingBtn.id = 'hchat-floating-btn'
  floatingBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  `
  floatingBtn.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y - 45}px;
    z-index: 2147483647;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #2563eb;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    transition: transform 0.15s ease;
    border: none;
  `

  floatingBtn.addEventListener('mouseenter', () => {
    if (floatingBtn) floatingBtn.style.transform = 'scale(1.1)'
  })
  floatingBtn.addEventListener('mouseleave', () => {
    if (floatingBtn) floatingBtn.style.transform = 'scale(1)'
  })

  floatingBtn.addEventListener('click', () => {
    const selectedText = window.getSelection()?.toString() || ''
    chrome.runtime.sendMessage({
      type: 'OPEN_SIDE_PANEL',
      payload: { selectedText },
    })
    removeFloatingButton()
  })

  document.body.appendChild(floatingBtn)
}

function removeFloatingButton(): void {
  if (floatingBtn) {
    floatingBtn.remove()
    floatingBtn = null
  }
}

document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection()
  const text = selection?.toString().trim()

  if (text && text.length > 3) {
    createFloatingButton(e.clientX, e.clientY)
  } else {
    removeFloatingButton()
  }
})

document.addEventListener('mousedown', (e) => {
  if (floatingBtn && !floatingBtn.contains(e.target as Node)) {
    removeFloatingButton()
  }
})
