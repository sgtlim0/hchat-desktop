// @ts-nocheck
import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, Plus, Play, Trash2, MessageSquare, Users, ThumbsUp, Award } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useMultiAgentDebateStore } from '@/entities/multi-agent-debate/multi-agent-debate.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

const AGENT_COLORS = [
  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700',
  'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700',
  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700',
  'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-pink-300 dark:border-pink-700',
]

export function MultiAgentDebatePage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const {
    debates,
    selectedDebateId,
    hydrate,
    createDebate,
    deleteDebate,
    selectDebate,
    addAgent,
    removeAgent,
    startDebate,
    vote,
    generateConsensus,
  } = useMultiAgentDebateStore(
    useShallow((s) => ({
      debates: s.debates,
      selectedDebateId: s.selectedDebateId,
      hydrate: s.hydrate,
      createDebate: s.createDebate,
      deleteDebate: s.deleteDebate,
      selectDebate: s.selectDebate,
      addAgent: s.addAgent,
      removeAgent: s.removeAgent,
      startDebate: s.startDebate,
      vote: s.vote,
      generateConsensus: s.generateConsensus,
    }))
  )

  const [showModal, setShowModal] = useState(false)
  const [newTopic, setNewTopic] = useState('')
  const [newRounds, setNewRounds] = useState(3)
  const [agentName, setAgentName] = useState('')
  const [agentRole, setAgentRole] = useState('')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const selected = debates.find((d) => d.id === selectedDebateId) ?? null

  function handleCreate() {
    if (!newTopic.trim()) return
    createDebate(newTopic.trim(), newRounds)
    setShowModal(false)
    setNewTopic('')
    setNewRounds(3)
  }

  function handleDelete(id: string) {
    if (confirm(t('multiAgentDebate.deleteConfirm'))) {
      deleteDebate(id)
    }
  }

  function handleAddAgent() {
    if (!selected || !agentName.trim()) return
    addAgent(selected.id, agentName.trim(), agentRole.trim())
    setAgentName('')
    setAgentRole('')
  }

  const currentRound = selected?.rounds[selected.currentRound - 1] ?? null

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
        <Users className="w-5 h-5" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t('multiAgentDebate.title')}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('multiAgentDebate.subtitle')}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />
          {t('multiAgentDebate.newDebate')}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Debate List */}
        <div className="w-72 border-r dark:border-zinc-700 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {debates.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-zinc-400" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('multiAgentDebate.empty')}</p>
                </div>
              </div>
            ) : (
              <div className="divide-y dark:divide-zinc-700">
                {debates.map((debate) => (
                  <button
                    key={debate.id}
                    onClick={() => selectDebate(debate.id)}
                    className={`w-full text-left p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group ${
                      selectedDebateId === debate.id ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate flex-1">{debate.topic}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(debate.id) }}
                        className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span>{debate.agents.length} {t('multiAgentDebate.agents')}</span>
                      <span>-</span>
                      <span className={`px-1.5 py-0.5 rounded ${
                        debate.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                          : debate.status === 'in-progress'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                      }`}>
                        {(t as any)(`multiAgentDebate.status.${debate.status}`)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Debate Detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Topic & Controls */}
              <div className="px-4 py-3 border-b dark:border-zinc-700">
                <h2 className="text-base font-semibold mb-1">{selected.topic}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">
                    {t('multiAgentDebate.roundProgress')
                      .replace('{current}', String(selected.currentRound))
                      .replace('{total}', String(selected.totalRounds))}
                  </span>
                  <div className="flex-1" />
                  {selected.status === 'pending' && selected.agents.length >= 2 && (
                    <Button size="sm" onClick={() => startDebate(selected.id)}>
                      <Play className="w-4 h-4 mr-1" />
                      {t('multiAgentDebate.start')}
                    </Button>
                  )}
                  {selected.status === 'in-progress' && (
                    <Button size="sm" variant="secondary" onClick={() => generateConsensus(selected.id)}>
                      <Award className="w-4 h-4 mr-1" />
                      {t('multiAgentDebate.consensus')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Agents bar */}
              <div className="px-4 py-2 border-b dark:border-zinc-700">
                <div className="flex items-center gap-2 flex-wrap">
                  {selected.agents.map((agent, idx) => (
                    <div
                      key={agent.id}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded border ${AGENT_COLORS[idx % AGENT_COLORS.length]}`}
                    >
                      <span className="font-medium">{agent.name}</span>
                      {agent.role && <span className="opacity-70">({agent.role})</span>}
                      {selected.status === 'pending' && (
                        <button
                          onClick={() => removeAgent(selected.id, agent.id)}
                          className="ml-1 hover:opacity-70"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {selected.status === 'pending' && (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder={t('multiAgentDebate.agentName')}
                        className="px-2 py-1 text-xs border dark:border-zinc-700 rounded dark:bg-zinc-800 w-24"
                      />
                      <input
                        type="text"
                        value={agentRole}
                        onChange={(e) => setAgentRole(e.target.value)}
                        placeholder={t('multiAgentDebate.agentRole')}
                        className="px-2 py-1 text-xs border dark:border-zinc-700 rounded dark:bg-zinc-800 w-24"
                      />
                      <button
                        onClick={handleAddAgent}
                        className="p-1 text-blue-500 hover:text-blue-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Round tabs */}
              {selected.rounds.length > 0 && (
                <div className="flex items-center gap-1 px-4 py-2 border-b dark:border-zinc-700 overflow-x-auto">
                  {selected.rounds.map((round, idx) => (
                    <button
                      key={round.id}
                      className={`px-3 py-1 text-xs rounded ${
                        idx === selected.currentRound - 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {t('multiAgentDebate.round')} {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Statements */}
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {currentRound ? (
                  currentRound.statements.map((statement) => {
                    const agentIdx = selected.agents.findIndex((a) => a.id === statement.agentId)
                    const agent = selected.agents[agentIdx]
                    return (
                      <div
                        key={statement.id}
                        className={`p-3 rounded-lg border ${AGENT_COLORS[agentIdx % AGENT_COLORS.length]}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold">{agent?.name ?? t('multiAgentDebate.unknownAgent')}</span>
                          {agent?.role && (
                            <span className="text-xs opacity-70">({agent.role})</span>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{statement.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => vote(selected.id, statement.id)}
                            className="flex items-center gap-1 text-xs hover:opacity-70"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            {statement.votes}
                          </button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('multiAgentDebate.noRounds')}</p>
                  </div>
                )}

                {/* Consensus */}
                {selected.consensus && (
                  <div className="p-4 rounded-lg border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-bold text-green-700 dark:text-green-400">
                        {t('multiAgentDebate.consensusResult')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-green-800 dark:text-green-300">
                      {selected.consensus}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="text-zinc-500 dark:text-zinc-400">{t('multiAgentDebate.selectDebate')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Debate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-lg font-semibold mb-4">{t('multiAgentDebate.newDebate')}</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder={t('multiAgentDebate.topicPlaceholder')}
                className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              />
              <div>
                <label className="block text-sm mb-1">{t('multiAgentDebate.rounds')}</label>
                <select
                  value={newRounds}
                  onChange={(e) => setNewRounds(Number(e.target.value))}
                  className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => { setShowModal(false); setNewTopic('') }}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreate}>{t('common.save')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
