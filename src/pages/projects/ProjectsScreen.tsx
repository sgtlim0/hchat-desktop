import { useShallow } from 'zustand/react/shallow'
import { useProjectStore } from '@/entities/project/project.store'
import { useSessionStore } from '@/entities/session/session.store'
import { Button } from '@/shared/ui/Button'
import { getRelativeTime } from '@/shared/lib/time'
import { useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { useTranslation } from '@/shared/i18n'

export function ProjectsScreen() {
  const { t } = useTranslation()
  const { projects, selectProject, createProject } = useProjectStore(
    useShallow((s) => ({
      projects: s.projects,
      selectProject: s.selectProject,
      createProject: s.createProject,
    }))
  )
  const setView = useSessionStore((s) => s.setView)
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
        <h1 className="text-2xl font-bold text-text-primary">{t('project.title')}</h1>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          {t('project.new')}
        </Button>
      </div>

      {/* Project Cards */}
      {projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-secondary text-sm mb-4">{t('project.empty')}</p>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            {t('project.createFirst')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {projects.map((project) => {
            const sessionCount = project.sessionIds.length
            const lastUpdated = getRelativeTime(project.updatedAt, t)

            return (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => handleProjectClick(project.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleProjectClick(project.id) } }}
                className="border border-border rounded-xl p-6 hover:border-primary/40 hover:shadow-sm cursor-pointer transition group focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-text-primary mb-1 group-hover:text-primary transition">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <span>{t('project.sessionCount', { count: sessionCount })}</span>
                  <span>·</span>
                  <span>{lastUpdated}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
            <h2 className="text-xl font-bold text-text-primary mb-4">{t('project.new')}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t('project.name')}
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder={t('project.namePlaceholder')}
                  className="w-full bg-input border border-border-input rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t('project.description')}
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder={t('project.descriptionPlaceholder')}
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
                {t('common.create')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewProjectName('')
                  setNewProjectDescription('')
                }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
