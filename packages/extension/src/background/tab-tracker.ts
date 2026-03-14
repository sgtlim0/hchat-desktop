interface TabInfo {
  readonly url: string
  readonly title: string
}

let activeTabInfo: TabInfo = { url: '', title: '' }

function updateTabInfo(tabId: number): void {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) return
    activeTabInfo = {
      url: tab.url ?? '',
      title: tab.title ?? '',
    }
  })
}

export function setupTabTracker(): void {
  chrome.tabs.onActivated.addListener(({ tabId }) => {
    updateTabInfo(tabId)
  })

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
      activeTabInfo = {
        url: tab.url ?? '',
        title: tab.title ?? '',
      }
    }
  })

  chrome.runtime.onMessage.addListener(
    (message: { type: string }, _sender, sendResponse) => {
      if (message.type === 'GET_PAGE_CONTEXT') {
        sendResponse(activeTabInfo)
        return true
      }
      return false
    },
  )
}
