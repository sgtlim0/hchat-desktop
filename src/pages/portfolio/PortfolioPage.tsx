// @ts-nocheck
import { useState, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { ArrowLeft, Plus, Trash2, Briefcase, Eye, EyeOff, Palette } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { usePortfolioStore } from '@/entities/portfolio/portfolio.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

const THEMES = ['minimal', 'modern', 'creative', 'developer', 'elegant'] as const
type PortfolioTheme = (typeof THEMES)[number]

const THEME_COLORS: Record<PortfolioTheme, string> = {
  minimal: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
  modern: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  creative: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  developer: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  elegant: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
}

export function PortfolioPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const {
    portfolios,
    selectedPortfolioId,
    hydrate,
    createPortfolio,
    deletePortfolio,
    selectPortfolio,
    addProject,
    removeProject,
    updateProject,
    setTheme,
    generateHtml,
  } = usePortfolioStore(
    useShallow((s) => ({
      portfolios: s.portfolios,
      selectedPortfolioId: s.selectedPortfolioId,
      hydrate: s.hydrate,
      createPortfolio: s.createPortfolio,
      deletePortfolio: s.deletePortfolio,
      selectPortfolio: s.selectPortfolio,
      addProject: s.addProject,
      removeProject: s.removeProject,
      updateProject: s.updateProject,
      setTheme: s.setTheme,
      generateHtml: s.generateHtml,
    }))
  )

  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newBio, setNewBio] = useState('')
  const [newTheme, setNewTheme] = useState<PortfolioTheme>('modern')
  const [showPreview, setShowPreview] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [projectTech, setProjectTech] = useState('')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const selected = portfolios.find((p) => p.id === selectedPortfolioId) ?? null

  function handleCreate() {
    if (!newName.trim()) return
    createPortfolio(newName.trim(), newTitle.trim(), newBio.trim(), newTheme)
    setShowModal(false)
    resetForm()
  }

  function resetForm() {
    setNewName('')
    setNewTitle('')
    setNewBio('')
    setNewTheme('modern')
  }

  function handleDelete(id: string) {
    if (confirm(t('portfolio.deleteConfirm'))) {
      deletePortfolio(id)
    }
  }

  function handleAddProject() {
    if (!selected || !projectName.trim()) return
    const techStack = projectTech
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    addProject(selected.id, projectName.trim(), projectDesc.trim(), techStack)
    setProjectName('')
    setProjectDesc('')
    setProjectTech('')
  }

  const previewHtml = useMemo(() => {
    if (!selected || !showPreview) return ''
    return selected.generatedHtml ?? ''
  }, [selected, showPreview])

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
        <Briefcase className="w-5 h-5" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t('portfolio.title')}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('portfolio.subtitle')}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />
          {t('portfolio.newPortfolio')}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Portfolio List */}
        <div className="w-72 border-r dark:border-zinc-700 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {portfolios.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <Briefcase className="w-10 h-10 mx-auto mb-2 text-zinc-400" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('portfolio.empty')}</p>
                </div>
              </div>
            ) : (
              <div className="divide-y dark:divide-zinc-700">
                {portfolios.map((portfolio) => (
                  <button
                    key={portfolio.id}
                    onClick={() => selectPortfolio(portfolio.id)}
                    className={`w-full text-left p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group ${
                      selectedPortfolioId === portfolio.id ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate flex-1">{portfolio.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(portfolio.id) }}
                        className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 text-xs rounded ${THEME_COLORS[portfolio.theme as PortfolioTheme] ?? THEME_COLORS.modern}`}>
                        {portfolio.theme}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {t('portfolio.projectCount').replace('{count}', String(portfolio.projects.length))}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Editor + Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center gap-2 px-4 py-2 border-b dark:border-zinc-700">
                <h2 className="text-sm font-semibold flex-1">{selected.name}</h2>

                {/* Theme selector */}
                <div className="flex items-center gap-1">
                  <Palette className="w-4 h-4 text-zinc-400" />
                  <select
                    value={selected.theme}
                    onChange={(e) => setTheme(selected.id, e.target.value)}
                    className="text-xs border dark:border-zinc-700 rounded px-2 py-1 dark:bg-zinc-800"
                  >
                    {THEMES.map((th) => (
                      <option key={th} value={th}>
                        {(t as any)(`portfolio.theme.${th}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded border ${
                    showPreview
                      ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'border-zinc-300 dark:border-zinc-600 text-zinc-500'
                  }`}
                >
                  {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showPreview ? t('portfolio.hidePreview') : t('portfolio.showPreview')}
                </button>

                <Button size="sm" onClick={() => generateHtml(selected.id)}>
                  {t('portfolio.generate')}
                </Button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Editor */}
                <div className={`flex flex-col overflow-hidden ${showPreview ? 'w-1/2 border-r dark:border-zinc-700' : 'flex-1'}`}>
                  {/* Info */}
                  <div className="p-4 border-b dark:border-zinc-700">
                    <p className="text-xs text-zinc-500 mb-1">{selected.title}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{selected.bio}</p>
                  </div>

                  {/* Projects */}
                  <div className="flex-1 overflow-auto p-4">
                    <h3 className="text-sm font-medium mb-3">
                      {t('portfolio.projects')} ({selected.projects.length})
                    </h3>

                    <div className="space-y-2 mb-4">
                      {selected.projects.map((project) => (
                        <div
                          key={project.id}
                          className="p-3 rounded-lg border dark:border-zinc-700 bg-white dark:bg-zinc-900"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <input
                              type="text"
                              value={project.title}
                              onChange={(e) => updateProject(selected.id, project.id, { title: e.target.value })}
                              className="flex-1 text-sm font-medium bg-transparent outline-none"
                            />
                            <button
                              onClick={() => removeProject(selected.id, project.id)}
                              className="p-1 text-zinc-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <textarea
                            value={project.description}
                            onChange={(e) => updateProject(selected.id, project.id, { description: e.target.value })}
                            placeholder={t('portfolio.projectDesc')}
                            rows={2}
                            className="w-full text-xs bg-transparent outline-none resize-none text-zinc-600 dark:text-zinc-400"
                          />
                          <div className="flex flex-wrap gap-1 mt-1">
                            {project.techStack.map((tech) => (
                              <span
                                key={tech}
                                className="px-1.5 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add project form */}
                    <div className="p-3 rounded-lg border dark:border-zinc-700 border-dashed space-y-2">
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder={t('portfolio.projectTitle')}
                        className="w-full px-2 py-1 text-sm border dark:border-zinc-700 rounded dark:bg-zinc-800"
                      />
                      <textarea
                        value={projectDesc}
                        onChange={(e) => setProjectDesc(e.target.value)}
                        placeholder={t('portfolio.projectDesc')}
                        rows={2}
                        className="w-full px-2 py-1 text-xs border dark:border-zinc-700 rounded dark:bg-zinc-800 resize-none"
                      />
                      <input
                        type="text"
                        value={projectTech}
                        onChange={(e) => setProjectTech(e.target.value)}
                        placeholder={t('portfolio.techStackHint')}
                        className="w-full px-2 py-1 text-xs border dark:border-zinc-700 rounded dark:bg-zinc-800"
                      />
                      <Button size="sm" onClick={handleAddProject}>
                        <Plus className="w-3 h-3 mr-1" />
                        {t('portfolio.addProject')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Preview iframe */}
                {showPreview && (
                  <div className="w-1/2 flex flex-col overflow-hidden">
                    <div className="px-3 py-1.5 border-b dark:border-zinc-700 text-xs font-medium text-zinc-500">
                      {t('portfolio.preview')}
                    </div>
                    {previewHtml ? (
                      <iframe
                        srcDoc={previewHtml}
                        sandbox="allow-scripts"
                        title="Portfolio Preview"
                        className="flex-1 bg-white"
                      />
                    ) : (
                      <div className="flex items-center justify-center flex-1 text-sm text-zinc-400">
                        {t('portfolio.noPreview')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="text-zinc-500 dark:text-zinc-400">{t('portfolio.selectPortfolio')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Portfolio Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <h2 className="text-lg font-semibold mb-4">{t('portfolio.newPortfolio')}</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('portfolio.namePlaceholder')}
                className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              />
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t('portfolio.jobTitle')}
                className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              />
              <textarea
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                placeholder={t('portfolio.bioPlaceholder')}
                rows={3}
                className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800 resize-none"
              />
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((th) => (
                  <button
                    key={th}
                    onClick={() => setNewTheme(th)}
                    className={`px-2 py-1.5 text-xs rounded border ${
                      newTheme === th
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {(t as any)(`portfolio.theme.${th}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => { setShowModal(false); resetForm() }}>
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
