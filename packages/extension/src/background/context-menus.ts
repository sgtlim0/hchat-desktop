const MENU_ITEMS = [
  { id: 'hchat-summarize', title: '이 페이지 요약', contexts: ['page'] as chrome.contextMenus.ContextType[] },
  { id: 'hchat-translate', title: '번역', contexts: ['selection'] as chrome.contextMenus.ContextType[] },
  { id: 'hchat-ask', title: 'H Chat에 질문', contexts: ['selection'] as chrome.contextMenus.ContextType[] },
] as const

export function setupContextMenus(): void {
  chrome.contextMenus.removeAll(() => {
    for (const item of MENU_ITEMS) {
      chrome.contextMenus.create({
        id: item.id,
        title: item.title,
        contexts: [...item.contexts],
      })
    }
  })

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab?.id) return

    const actionMap: Record<string, 'summarize' | 'translate' | 'ask'> = {
      'hchat-summarize': 'summarize',
      'hchat-translate': 'translate',
      'hchat-ask': 'ask',
    }

    const action = actionMap[info.menuItemId as string]
    if (!action) return

    chrome.sidePanel.open({ tabId: tab.id })

    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'CONTEXT_MENU_ACTION',
        action,
        text: info.selectionText ?? '',
      })
    }, 300)
  })
}
