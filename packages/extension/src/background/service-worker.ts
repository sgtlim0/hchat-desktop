import { setupContextMenus } from './context-menus'
import { setupSSERelay } from './sse-relay'
import { setupTabTracker } from './tab-tracker'

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus()
})

setupSSERelay()

setupTabTracker()

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id })
  }
})
