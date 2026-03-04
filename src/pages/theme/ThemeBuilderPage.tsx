import { useState } from 'react'
import { X, Palette, Plus, Trash2, Check, Copy } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useThemeStore } from '@/entities/theme/theme.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'

export function ThemeBuilderPage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const {
    themes,
    selectedThemeId,
    selectTheme,
    addTheme,
    updateTheme,
    deleteTheme,
    activateTheme,
    deactivateTheme,
    duplicateTheme,
  } = useThemeStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [colorVars, setColorVars] = useState({
    '--color-primary': '#0ea5e9',
    '--color-bg': '#0f172a',
    '--color-card': '#1e293b',
    '--color-border': '#334155',
    '--color-text-primary': '#f1f5f9',
  })

  const selectedTheme = themes.find((t) => t.id === selectedThemeId)

  function handleAddTheme() {
    if (!newName.trim()) return
    addTheme(newName, colorVars)
    setNewName('')
    setColorVars({
      '--color-primary': '#0ea5e9',
      '--color-bg': '#0f172a',
      '--color-card': '#1e293b',
      '--color-border': '#334155',
      '--color-text-primary': '#f1f5f9',
    })
    setShowAddModal(false)
  }

  function handleEditTheme() {
    if (!editingThemeId || !newName.trim()) return
    updateTheme(editingThemeId, { name: newName, variables: colorVars })
    setEditingThemeId(null)
    setNewName('')
  }

  function handleDeleteTheme(id: string) {
    if (confirm(t('themeBuilder.deleteConfirm'))) {
      deleteTheme(id)
      if (selectedThemeId === id) {
        selectTheme(null)
      }
    }
  }

  function handleActivate(id: string) {
    activateTheme(id)
  }

  function handleDeactivate(id: string) {
    deactivateTheme(id)
  }

  function handleDuplicate(id: string) {
    duplicateTheme(id)
  }

  function handleEditStart(id: string) {
    const theme = themes.find((t) => t.id === id)
    if (!theme) return
    setEditingThemeId(id)
    setNewName(theme.name)
    setColorVars(theme.variables as typeof colorVars)
    selectTheme(id)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <Palette className="h-6 w-6 text-text-primary" />
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{t('themeBuilder.title')}</h1>
            <p className="text-sm text-text-secondary">{t('themeBuilder.subtitle')}</p>
          </div>
        </div>
        <button onClick={() => setView('home')} className="rounded-lg p-2 text-text-secondary hover:bg-hover">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="grid h-full grid-cols-[300px,1fr]">
          <div className="flex flex-col border-r border-border bg-card">
            <div className="border-b border-border p-4">
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => {
                  setShowAddModal(true)
                  setNewName('')
                  setColorVars({
                    '--color-primary': '#0ea5e9',
                    '--color-bg': '#0f172a',
                    '--color-card': '#1e293b',
                    '--color-border': '#334155',
                    '--color-text-primary': '#f1f5f9',
                  })
                }}
              >
                <Plus className="h-4 w-4" />
                {t('themeBuilder.newTheme')}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {themes.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <Palette className="h-12 w-12 text-text-secondary opacity-30" />
                  <p className="text-sm text-text-secondary">{t('themeBuilder.noThemes')}</p>
                </div>
              )}

              <div className="space-y-2">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => selectTheme(theme.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-all ${
                      selectedThemeId === theme.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background hover:border-border/80'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-medium text-text-primary">{theme.name}</h3>
                      {theme.isActive && (
                        <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                          <Check className="h-3 w-3" />
                          활성
                        </span>
                      )}
                    </div>

                    <div className="mb-2 flex gap-1">
                      {Object.entries(theme.variables).slice(0, 5).map(([key, value]) => (
                        <div
                          key={key}
                          className="h-6 w-6 rounded border border-border"
                          style={{ backgroundColor: value }}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-text-secondary">
                      {new Date(theme.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col bg-background">
            {selectedTheme ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-border p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-primary">{selectedTheme.name}</h2>
                    <div className="flex items-center gap-2">
                      {selectedTheme.isActive ? (
                        <button
                          onClick={() => handleDeactivate(selectedTheme.id)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-hover"
                        >
                          {t('themeBuilder.deactivate')}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(selectedTheme.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                        >
                          <Check className="h-4 w-4" />
                          {t('themeBuilder.activate')}
                        </button>
                      )}
                      <button onClick={() => selectTheme(null)} className="rounded-lg p-2 text-text-secondary hover:bg-hover">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditStart(selectedTheme.id)}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(selectedTheme.id)}
                    >
                      <Copy className="h-4 w-4" />
                      복제
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTheme(selectedTheme.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {editingThemeId === selectedTheme.id ? (
                    <div className="space-y-6">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-text-primary">
                          {t('themeBuilder.themeName')}
                        </label>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <h3 className="mb-4 text-sm font-medium text-text-primary">{t('themeBuilder.colors')}</h3>
                        <div className="space-y-4">
                          {Object.entries(colorVars).map(([key, value]) => {
                            const label =
                              key === '--color-primary' ? t('themeBuilder.primary') :
                              key === '--color-bg' ? t('themeBuilder.background') :
                              key === '--color-card' ? t('themeBuilder.surface') :
                              key === '--color-text-primary' ? t('themeBuilder.text') :
                              key === '--color-border' ? t('themeBuilder.border') :
                              key

                            return (
                              <div key={key}>
                                <label className="mb-2 block text-sm text-text-secondary">{label}</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={value}
                                    onChange={(e) =>
                                      setColorVars((prev) => ({
                                        ...prev,
                                        [key]: e.target.value,
                                      }))
                                    }
                                    className="h-10 w-20 cursor-pointer rounded border border-border"
                                  />
                                  <input
                                    type="text"
                                    value={value}
                                    onChange={(e) =>
                                      setColorVars((prev) => ({
                                        ...prev,
                                        [key]: e.target.value,
                                      }))
                                    }
                                    className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="primary" onClick={handleEditTheme}>
                          {t('common.save')}
                        </Button>
                        <button
                          onClick={() => setEditingThemeId(null)}
                          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-primary hover:bg-hover"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="mb-4 text-sm font-medium text-text-primary">{t('themeBuilder.preview')}</h3>
                        <div
                          className="rounded-xl border p-6"
                          style={{
                            backgroundColor: selectedTheme.variables['--color-bg'],
                            borderColor: selectedTheme.variables['--color-border'],
                          }}
                        >
                          <div
                            className="mb-4 rounded-lg border p-4"
                            style={{
                              backgroundColor: selectedTheme.variables['--color-card'],
                              borderColor: selectedTheme.variables['--color-border'],
                            }}
                          >
                            <h4
                              className="mb-2 font-semibold"
                              style={{ color: selectedTheme.variables['--color-text-primary'] }}
                            >
                              Sample Card
                            </h4>
                            <p style={{ color: selectedTheme.variables['--color-text-primary'], opacity: 0.7 }}>
                              This is how text looks in your theme
                            </p>
                          </div>

                          <button
                            className="rounded-lg px-4 py-2 font-medium"
                            style={{
                              backgroundColor: selectedTheme.variables['--color-primary'],
                              color: '#fff',
                            }}
                          >
                            Primary Button
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-4 text-sm font-medium text-text-primary">{t('themeBuilder.colors')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(selectedTheme.variables).map(([key, value]) => {
                            const label =
                              key === '--color-primary' ? t('themeBuilder.primary') :
                              key === '--color-bg' ? t('themeBuilder.background') :
                              key === '--color-card' ? t('themeBuilder.surface') :
                              key === '--color-text-primary' ? t('themeBuilder.text') :
                              key === '--color-border' ? t('themeBuilder.border') :
                              key

                            return (
                              <div key={key} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                                <div
                                  className="h-10 w-10 rounded border border-border"
                                  style={{ backgroundColor: value }}
                                />
                                <div>
                                  <p className="text-sm font-medium text-text-primary">{label}</p>
                                  <p className="text-xs text-text-secondary">{value}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div>
                  <Palette className="mx-auto mb-2 h-12 w-12 text-text-secondary opacity-30" />
                  <p className="text-sm text-text-secondary">테마를 선택하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">{t('themeBuilder.newTheme')}</h2>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-text-primary">
                {t('themeBuilder.themeName')}
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My Custom Theme"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="mb-6">
              <h3 className="mb-4 text-sm font-medium text-text-primary">{t('themeBuilder.colors')}</h3>
              <div className="space-y-3">
                {Object.entries(colorVars).map(([key, value]) => {
                  const label =
                    key === '--color-primary' ? t('themeBuilder.primary') :
                    key === '--color-bg' ? t('themeBuilder.background') :
                    key === '--color-card' ? t('themeBuilder.surface') :
                    key === '--color-text-primary' ? t('themeBuilder.text') :
                    key === '--color-border' ? t('themeBuilder.border') :
                    key

                  return (
                    <div key={key} className="flex items-center gap-2">
                      <label className="w-24 text-sm text-text-secondary">{label}</label>
                      <input
                        type="color"
                        value={value}
                        onChange={(e) =>
                          setColorVars((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="h-8 w-16 cursor-pointer rounded border border-border"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          setColorVars((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-text-primary outline-none focus:border-primary"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="primary" onClick={handleAddTheme}>
                {t('common.create')}
              </Button>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-primary hover:bg-hover"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
