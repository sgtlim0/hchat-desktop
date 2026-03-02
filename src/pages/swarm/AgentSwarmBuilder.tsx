import { Network, Play, Square } from 'lucide-react'
import { useSwarmStore } from '@/entities/swarm/swarm.store'
import { Button } from '@/shared/ui/Button'
import { AGENT_ROLE_COLORS, AGENT_ROLE_LABELS, SWARM_TEMPLATES } from '@/shared/constants'
import { useTranslation, type TranslationKey } from '@/shared/i18n'
import type { AgentRole, AgentStatus } from '@/shared/types'

const ROLES: AgentRole[] = ['planner', 'researcher', 'coder', 'reviewer', 'synthesizer']

function statusColor(status: AgentStatus): string {
  switch (status) {
    case 'idle': return 'bg-gray-400'
    case 'running': return 'bg-blue-500 animate-pulse'
    case 'done': return 'bg-green-500'
    case 'error': return 'bg-red-500'
  }
}

export function AgentSwarmBuilder() {
  const { t } = useTranslation()
  const { agents, connections, selectedTemplate, isRunning, setTemplate, startSwarm, stopSwarm, resetSwarm } = useSwarmStore()

  function statusLabel(status: AgentStatus): string {
    const map: Record<AgentStatus, string> = {
      idle: t('swarm.idle'),
      running: t('swarm.running'),
      done: t('swarm.done'),
      error: t('swarm.error'),
    }
    return map[status]
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Network size={18} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold text-text-primary">{t('swarm.title')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTemplate}
              onChange={(e) => setTemplate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-input text-text-primary text-sm outline-none focus:border-primary transition"
            >
              {SWARM_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>{t(template.nameKey as TranslationKey)}</option>
              ))}
            </select>
            {isRunning ? (
              <Button variant="secondary" size="sm" onClick={stopSwarm} className="gap-1.5">
                <Square size={14} />
                {t('swarm.stop')}
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={startSwarm} className="gap-1.5">
                <Play size={14} />
                {t('swarm.start')}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={resetSwarm}>
              {t('common.reset')}
            </Button>
          </div>
        </div>
      </div>

      {/* Agent Palette */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary font-medium mr-1">{t('swarm.agents')}</span>
          {ROLES.map((role) => (
            <button
              key={role}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition hover:opacity-80"
              style={{
                borderColor: AGENT_ROLE_COLORS[role],
                color: AGENT_ROLE_COLORS[role],
                backgroundColor: `${AGENT_ROLE_COLORS[role]}15`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: AGENT_ROLE_COLORS[role] }}
              />
              {AGENT_ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden relative bg-page">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Grid pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Connection lines */}
          {connections.map((conn) => {
            const fromAgent = agents.find((a) => a.id === conn.from)
            const toAgent = agents.find((a) => a.id === conn.to)
            if (!fromAgent || !toAgent) return null
            return (
              <line
                key={conn.id}
                x1={fromAgent.x + 80}
                y1={fromAgent.y + 40}
                x2={toAgent.x + 80}
                y2={toAgent.y + 40}
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="6 3"
                className="text-text-tertiary"
                markerEnd="url(#arrowhead)"
              />
            )
          })}

          {/* Arrowhead marker */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-text-tertiary" />
            </marker>
          </defs>
        </svg>

        {/* Agent nodes */}
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="absolute bg-card border-2 rounded-xl shadow-sm p-3 cursor-move hover:shadow-md transition"
            style={{
              left: agent.x,
              top: agent.y,
              width: 160,
              height: 80,
              borderColor: AGENT_ROLE_COLORS[agent.role],
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-text-primary">{agent.label}</span>
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: AGENT_ROLE_COLORS[agent.role] }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor(agent.status)}`} />
              <span className="text-[11px] text-text-secondary">{statusLabel(agent.status)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
