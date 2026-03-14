const BUTTON_ID = 'hchat-floating-btn'
const BUTTON_SIZE = 32

function createButton(): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.id = BUTTON_ID
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
  btn.title = 'H Chat에 질문'

  Object.assign(btn.style, {
    position: 'fixed',
    zIndex: '2147483647',
    width: `${BUTTON_SIZE}px`,
    height: `${BUTTON_SIZE}px`,
    borderRadius: '50%',
    border: 'none',
    background: '#6366f1',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    transition: 'opacity 0.15s',
    opacity: '0',
    pointerEvents: 'none',
  })

  document.body.appendChild(btn)
  return btn
}

function showButton(btn: HTMLButtonElement, x: number, y: number): void {
  btn.style.left = `${x}px`
  btn.style.top = `${y - BUTTON_SIZE - 8}px`
  btn.style.opacity = '1'
  btn.style.pointerEvents = 'auto'
}

function hideButton(btn: HTMLButtonElement): void {
  btn.style.opacity = '0'
  btn.style.pointerEvents = 'none'
}

export function setupFloatingButton(): void {
  const btn = createButton()

  document.addEventListener('mouseup', (e) => {
    if (e.target === btn) return

    const selection = window.getSelection()
    const text = selection?.toString().trim()

    if (text && text.length > 0) {
      showButton(btn, e.clientX, e.clientY)
    } else {
      hideButton(btn)
    }
  })

  btn.addEventListener('click', () => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()

    if (text) {
      chrome.runtime.sendMessage({
        type: 'SELECTED_TEXT',
        text,
      })
    }

    hideButton(btn)
  })

  document.addEventListener('mousedown', (e) => {
    if (e.target !== btn) {
      hideButton(btn)
    }
  })
}
