import { useProjectStore } from '@/entities/project/project.store'
import { useSessionStore } from '@/entities/session/session.store'
import { Button } from '@/shared/ui/Button'
import { getRelativeTime } from '@/shared/lib/time'
import { useState } from 'react'

export function ProjectsScreen() {
  const { projects, selectProject, createProject } = useProjectStore()
  const { setView } = useSessionStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName, newProjectDescription)
      setNewProjectName('')
      setNewProjectDescription('')
      setShowCreateModal(false)
      setView('projectDetail')
    }
  }

  const handleProjectClick = (id: string) => {
    selectProject(id)
    setView('projectDetail')
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">프로젝트</h1>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          새 프로젝트
        </Button>
      </div>

      {/* Project Cards */}
      <div className="space-y-3">
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-secondary text-sm mb-4">아직 프로젝트가 없습니다</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              첫 프로젝트 만들기
            </Button>
          </div>
        ) : (
          projects.map((project) => {
            const sessionCount = project.sessionIds.length
            const lastUpdated = getRelativeTime(project.updatedAt)

            return (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="border border-border rounded-xl p-5 hover:bg-hover/50 cursor-pointer transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-text-primary">{project.name}</h3>
                </div>
                {project.description && (
                  <p className="text-text-secondary text-sm mb-3">{project.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span>{sessionCount}개의 세션</span>
                  <span>·</span>
                  <span>{lastUpdated}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false)
            }
          }}
        >
          <div className="bg-page rounded-xl w-[480px] shadow-2xl border border-border p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">새 프로젝트</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  프로젝트 이름
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="프로젝트 이름 입력..."
                  className="w-full bg-input border border-border-input rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  설명 (선택)
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="프로젝트 설명..."
                  rows={3}
                  className="w-full bg-input border border-border-input rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button
                variant="primary"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
              >
                생성
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewProjectName('')
                  setNewProjectDescription('')
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
