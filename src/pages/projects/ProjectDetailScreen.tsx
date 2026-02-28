import { useState } from 'react'
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react'
import { useProjectStore } from '@/entities/project/project.store'
import { useSessionStore } from '@/entities/session/session.store'
import { Button } from '@/shared/ui/Button'
import { getRelativeTime } from '@/shared/lib/time'
import type { ProjectMemory } from '@/shared/types'

export function ProjectDetailScreen() {
  const { projects, selectedProjectId, updateProject, deleteProject, selectProject } = useProjectStore()
  const { sessions, setView, selectSession } = useSessionStore()
  const [showAddMemory, setShowAddMemory] = useState(false)
  const [newMemoryKey, setNewMemoryKey] = useState('')
  const [newMemoryValue, setNewMemoryValue] = useState('')
  const [editingInstructions, setEditingInstructions] = useState<string | null>(null)

  const project = projects.find((p) => p.id === selectedProjectId)

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center text-text-secondary">
        프로젝트를 찾을 수 없습니다
      </div>
    )
  }

  const relatedSessions = sessions.filter((s) => project.sessionIds.includes(s.id))

  const handleBack = () => {
    selectProject(null)
    setView('projects')
  }

  const handleSaveInstructions = () => {
    if (editingInstructions !== null) {
      updateProject(project.id, { instructions: editingInstructions })
      setEditingInstructions(null)
    }
  }

  const handleAddMemory = () => {
    if (newMemoryKey.trim() && newMemoryValue.trim()) {
      const newMemory: ProjectMemory = {
        id: `memory-${Date.now()}`,
        key: newMemoryKey,
        value: newMemoryValue,
      }
      updateProject(project.id, {
        memories: [...project.memories, newMemory],
      })
      setNewMemoryKey('')
      setNewMemoryValue('')
      setShowAddMemory(false)
    }
  }

  const handleDeleteMemory = (memoryId: string) => {
    updateProject(project.id, {
      memories: project.memories.filter((m) => m.id !== memoryId),
    })
  }

  const handleDeleteProject = () => {
    if (confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) {
      deleteProject(project.id)
      setView('projects')
    }
  }

  const handleSessionClick = (sessionId: string) => {
    selectSession(sessionId)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">프로젝트</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">{project.name}</h1>
        {project.description && (
          <p className="text-text-secondary text-sm">{project.description}</p>
        )}
      </div>

      {/* Project Instructions */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-3">프로젝트 지침</h2>
        {editingInstructions !== null ? (
          <div>
            <textarea
              value={editingInstructions}
              onChange={(e) => setEditingInstructions(e.target.value)}
              onBlur={handleSaveInstructions}
              placeholder="프로젝트 지침을 입력하세요..."
              rows={6}
              className="w-full bg-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition resize-none"
              autoFocus
            />
          </div>
        ) : (
          <div
            onClick={() => setEditingInstructions(project.instructions)}
            className="bg-card border border-border rounded-lg px-4 py-3 text-sm text-text-primary cursor-text hover:bg-hover/50 transition min-h-[120px]"
          >
            {project.instructions || (
              <span className="text-text-tertiary">클릭하여 프로젝트 지침을 추가하세요...</span>
            )}
          </div>
        )}
      </section>

      {/* Project Memory */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">프로젝트 메모리</h2>
          <Button variant="secondary" size="sm" onClick={() => setShowAddMemory(true)}>
            <Plus className="w-4 h-4 mr-1" />
            추가
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {project.memories.map((memory) => (
            <div
              key={memory.id}
              className="bg-card rounded-lg p-4 border border-border relative group"
            >
              <button
                onClick={() => handleDeleteMemory(memory.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-text-tertiary hover:text-danger"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="font-medium text-sm text-text-primary mb-1">{memory.key}</div>
              <div className="text-text-secondary text-xs">{memory.value}</div>
            </div>
          ))}
        </div>

        {project.memories.length === 0 && !showAddMemory && (
          <div className="text-center py-8 text-text-secondary text-sm">
            아직 메모리가 없습니다
          </div>
        )}
      </section>

      {/* Related Sessions */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-3">관련 세션</h2>
        {relatedSessions.length === 0 ? (
          <div className="text-center py-8 text-text-secondary text-sm">
            관련 세션이 없습니다
          </div>
        ) : (
          <div className="space-y-2">
            {relatedSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSessionClick(session.id)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-hover cursor-pointer transition border border-border"
              >
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-text-primary truncate">
                    {session.title}
                  </div>
                </div>
                <div className="text-xs text-text-tertiary flex-shrink-0">
                  {getRelativeTime(session.updatedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Delete Project */}
      <div className="pt-8 border-t border-border">
        <Button variant="danger" onClick={handleDeleteProject}>
          <Trash2 className="w-4 h-4 mr-2" />
          프로젝트 삭제
        </Button>
      </div>

      {/* Add Memory Modal */}
      {showAddMemory && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddMemory(false)
            }
          }}
        >
          <div className="bg-page rounded-xl w-[480px] shadow-2xl border border-border p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">메모리 추가</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">키</label>
                <input
                  type="text"
                  value={newMemoryKey}
                  onChange={(e) => setNewMemoryKey(e.target.value)}
                  placeholder="예: API 엔드포인트"
                  className="w-full bg-input border border-border-input rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">값</label>
                <textarea
                  value={newMemoryValue}
                  onChange={(e) => setNewMemoryValue(e.target.value)}
                  placeholder="예: https://api.example.com/v1"
                  rows={3}
                  className="w-full bg-input border border-border-input rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button
                variant="primary"
                onClick={handleAddMemory}
                disabled={!newMemoryKey.trim() || !newMemoryValue.trim()}
              >
                추가
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddMemory(false)
                  setNewMemoryKey('')
                  setNewMemoryValue('')
                }}
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
