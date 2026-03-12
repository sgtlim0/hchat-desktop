import { useState, useEffect } from 'react'
import { FileText, Languages, BookOpen, Search, Settings } from 'lucide-react'

const actions = [
  { id: 'summarize', label: 'Summarize', Icon: FileText },
  { id: 'translate', label: 'Translate', Icon: Languages },
  { id: 'explain', label: 'Explain', Icon: BookOpen },
  { id: 'ask', label: 'Ask AI', Icon: Search },
]

export function PopupApp() {
  const [pageTitle, setPageTitle] = useState('')
  const [pageUrl, setPageUrl] = useState('')

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab) {
        setPageTitle(tab.title || '')
        setPageUrl(tab.url || '')
      }
    })
  }, [])

  async function handleAction(action: string) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return

    // Open side panel
    await chrome.sidePanel.open({ tabId: tab.id })

    // Send quick action after panel opens
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'QUICK_ACTION',
        payload: { action, selectedText: '', tabId: tab.id },
      })
    }, 500)

    window.close()
  }

  function handleSettings() {
    chrome.runtime.openOptionsPage()
    window.close()
  }

  return (
    <div className="flex h-[400px] w-[320px] flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
            H
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            H Chat
          </span>
        </div>
        <button
          onClick={handleSettings}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Current page */}
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
          {pageTitle || 'No page detected'}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-slate-400">
          {pageUrl}
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex-1 px-4 py-4">
        <p className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {actions.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => handleAction(id)}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white py-4
                transition-all hover:scale-[1.02] hover:border-blue-400 hover:shadow-sm
                dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500"
            >
              <Icon className="h-6 w-6 text-blue-500" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-2 text-center text-[10px] text-slate-400 dark:border-slate-800">
        H Chat Extension v1.0
      </div>
    </div>
  )
}
