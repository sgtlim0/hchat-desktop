import { useState, useEffect } from 'react'
import { MessageCircle, FileSearch, History } from 'lucide-react'
import { ChatView } from './ChatView'
import { PageAnalysisView } from './PageAnalysisView'
import { HistoryView } from './HistoryView'
import { ToastContainer } from '../components/ToastContainer'

type Tab = 'chat' | 'analysis' | 'history'

const tabs: Array<{ id: Tab; label: string; Icon: typeof MessageCircle }> = [
  { id: 'chat', label: 'Chat', Icon: MessageCircle },
  { id: 'analysis', label: 'Page Analysis', Icon: FileSearch },
  { id: 'history', label: 'History', Icon: History },
]

export function SidePanelApp() {
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [quickAction, setQuickAction] = useState<{ action: string; text: string } | null>(null)

  // Listen for QUICK_ACTION from background
  useEffect(() => {
    const listener = (message: { type?: string; payload?: { action?: string; selectedText?: string } }) => {
      if (message.type === 'QUICK_ACTION' && message.payload) {
        const { action, selectedText } = message.payload
        if (action && selectedText) {
          setQuickAction({ action, text: selectedText })
          setActiveTab('chat')
        }
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  function handleResume(_sessionId: string) {
    setActiveTab('chat')
  }

  return (
    <div className="flex h-screen flex-col bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && <ChatView initialAction={quickAction} />}
        {activeTab === 'analysis' && <PageAnalysisView />}
        {activeTab === 'history' && <HistoryView onResume={handleResume} />}
      </div>

      {/* Tab bar */}
      <nav className="flex shrink-0 border-t border-slate-200 dark:border-slate-700">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors
              ${
                activeTab === id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <ToastContainer />
    </div>
  )
}
