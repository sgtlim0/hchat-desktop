import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, Plus, Send, Trash2, Copy, ChevronDown } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useApiTesterStore } from '@/entities/api-tester/api-tester.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'
import type { HttpMethod, ApiHeader } from '@/shared/types'

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  POST: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PUT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export function ApiTesterPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const {
    requests,
    selectedRequestId,
    lastResponse,
    isLoading,
    hydrate,
    addRequest,
    updateRequest,
    deleteRequest,
    selectRequest,
    setResponse,
    setLoading,
  } = useApiTesterStore(
    useShallow((s) => ({
      requests: s.requests,
      selectedRequestId: s.selectedRequestId,
      lastResponse: s.lastResponse,
      isLoading: s.isLoading,
      hydrate: s.hydrate,
      addRequest: s.addRequest,
      updateRequest: s.updateRequest,
      deleteRequest: s.deleteRequest,
      selectRequest: s.selectRequest,
      setResponse: s.setResponse,
      setLoading: s.setLoading,
    }))
  )

  const [activeTab, setActiveTab] = useState<'headers' | 'body'>('headers')
  const [showMethodDropdown, setShowMethodDropdown] = useState(false)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const selected = requests.find((r) => r.id === selectedRequestId)

  const handleSend = () => {
    if (!selected || !selected.url.trim()) return

    setLoading(true)

    // Simulate API call (no actual fetch due to CORS)
    setTimeout(() => {
      const simulatedResponse = {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          { message: 'Simulated response', url: selected.url, method: selected.method },
          null,
          2
        ),
        duration: Math.floor(Math.random() * 300) + 50,
        size: 128,
        timestamp: new Date().toISOString(),
      }
      setResponse(simulatedResponse)
      setLoading(false)
    }, 800)
  }

  const handleAddHeader = () => {
    if (!selected) return
    const newHeader: ApiHeader = { key: '', value: '', enabled: true }
    updateRequest(selected.id, {
      headers: [...selected.headers, newHeader],
    })
  }

  const handleUpdateHeader = (index: number, field: keyof ApiHeader, value: string | boolean) => {
    if (!selected) return
    const updatedHeaders = selected.headers.map((h, i) =>
      i === index ? { ...h, [field]: value } : h
    )
    updateRequest(selected.id, { headers: updatedHeaders })
  }

  const handleRemoveHeader = (index: number) => {
    if (!selected) return
    const updatedHeaders = selected.headers.filter((_, i) => i !== index)
    updateRequest(selected.id, { headers: updatedHeaders })
  }

  const handleCopyResponse = () => {
    if (lastResponse?.body) {
      navigator.clipboard.writeText(lastResponse.body).catch(() => {})
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b dark:border-zinc-700">
        <button
          onClick={() => setView('home')}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t('apiTester.title')}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('apiTester.subtitle')}</p>
        </div>
        <Button onClick={addRequest} className="text-sm">
          <Plus className="w-4 h-4 mr-1" />
          {t('apiTester.newRequest')}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - saved requests */}
        <aside className="w-64 border-r dark:border-zinc-700 overflow-y-auto flex-shrink-0">
          {requests.length === 0 ? (
            <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t('apiTester.empty')}
            </div>
          ) : (
            <ul className="py-1">
              {requests.map((req) => (
                <li
                  key={req.id}
                  role="button"
                  onClick={() => selectRequest(req.id)}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${
                    req.id === selectedRequestId
                      ? 'bg-zinc-100 dark:bg-zinc-800'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[req.method]}`}>
                    {req.method}
                  </span>
                  <span className="truncate flex-1">{req.name || req.url || 'Untitled'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(t('apiTester.deleteConfirm'))) {
                        deleteRequest(req.id)
                      }
                    }}
                    className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-500"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Main area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
              {t('apiTester.empty')}
            </div>
          ) : (
            <>
              {/* Request name */}
              <div className="px-4 pt-3">
                <input
                  type="text"
                  value={selected.name}
                  onChange={(e) => updateRequest(selected.id, { name: e.target.value })}
                  placeholder={t('apiTester.requestName')}
                  className="text-sm font-medium bg-transparent border-none outline-none w-full text-zinc-900 dark:text-zinc-100"
                />
              </div>

              {/* URL bar */}
              <div className="flex items-center gap-2 px-4 py-3">
                {/* Method dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowMethodDropdown(!showMethodDropdown)}
                    className={`flex items-center gap-1 px-2 py-1.5 text-sm font-bold rounded border dark:border-zinc-600 ${METHOD_COLORS[selected.method]}`}
                    data-testid="method-dropdown"
                  >
                    {selected.method}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showMethodDropdown && (
                    <div className="absolute z-10 top-full mt-1 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded shadow-lg">
                      {METHODS.map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            updateRequest(selected.id, { method: m })
                            setShowMethodDropdown(false)
                          }}
                          className={`block w-full text-left px-3 py-1.5 text-sm font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 ${METHOD_COLORS[m]}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* URL input */}
                <input
                  type="text"
                  value={selected.url}
                  onChange={(e) => updateRequest(selected.id, { url: e.target.value })}
                  placeholder={t('apiTester.urlPlaceholder')}
                  className="flex-1 px-3 py-1.5 text-sm border dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Send button */}
                <Button onClick={handleSend} disabled={isLoading} className="text-sm">
                  <Send className="w-4 h-4 mr-1" />
                  {isLoading ? t('apiTester.sending') : t('apiTester.send')}
                </Button>
              </div>

              {/* Tabs: Headers / Body */}
              <div className="flex border-b dark:border-zinc-700 px-4">
                <button
                  onClick={() => setActiveTab('headers')}
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'headers'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {t('apiTester.headers')}
                  {selected.headers.length > 0 && (
                    <span className="ml-1 text-xs text-zinc-400">({selected.headers.length})</span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('body')}
                  className={`px-3 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'body'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {t('apiTester.body')}
                </button>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-auto">
                {activeTab === 'headers' ? (
                  <div className="p-4 space-y-2">
                    {selected.headers.map((header, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={header.enabled}
                          onChange={(e) => handleUpdateHeader(idx, 'enabled', e.target.checked)}
                          className="rounded"
                        />
                        <input
                          type="text"
                          value={header.key}
                          onChange={(e) => handleUpdateHeader(idx, 'key', e.target.value)}
                          placeholder="Key"
                          className="flex-1 px-2 py-1 text-sm border dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 outline-none"
                        />
                        <input
                          type="text"
                          value={header.value}
                          onChange={(e) => handleUpdateHeader(idx, 'value', e.target.value)}
                          placeholder="Value"
                          className="flex-1 px-2 py-1 text-sm border dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 outline-none"
                        />
                        <button
                          onClick={() => handleRemoveHeader(idx)}
                          className="p-1 text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddHeader}
                      className="text-sm text-blue-500 hover:text-blue-600"
                    >
                      + {t('apiTester.addHeader')}
                    </button>
                  </div>
                ) : (
                  <div className="p-4">
                    <textarea
                      value={selected.body}
                      onChange={(e) => updateRequest(selected.id, { body: e.target.value })}
                      placeholder={t('apiTester.bodyPlaceholder')}
                      className="w-full h-48 px-3 py-2 text-sm font-mono border dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 outline-none resize-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Response area */}
              <div className="border-t dark:border-zinc-700">
                <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50">
                  <h3 className="text-sm font-semibold">{t('apiTester.response')}</h3>
                  {lastResponse && (
                    <>
                      <span
                        className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                          lastResponse.status < 300
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : lastResponse.status < 400
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {lastResponse.status} {lastResponse.statusText}
                      </span>
                      <span className="text-xs text-zinc-500">{lastResponse.duration}ms</span>
                      <span className="text-xs text-zinc-500">{formatBytes(lastResponse.size)}</span>
                      <button
                        onClick={handleCopyResponse}
                        className="ml-auto p-1 text-zinc-400 hover:text-zinc-600"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
                <div className="px-4 py-2 max-h-48 overflow-auto">
                  {lastResponse ? (
                    <pre className="text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      {lastResponse.body}
                    </pre>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {t('apiTester.noResponse')}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
