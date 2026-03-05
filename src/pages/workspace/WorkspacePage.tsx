import { useState } from 'react'
import { X, Users2, Plus, UserPlus, BookOpen, Database, Activity, Crown, Pencil, Eye, Trash2 } from 'lucide-react'
import { useSessionStore } from '@/entities/session/session.store'
import { useWorkspaceStore } from '@/entities/workspace/workspace.store'
import { useTranslation } from '@/shared/i18n'
import { Button } from '@/shared/ui/Button'
import type { Workspace, WorkspaceRole } from '@/shared/types'

export function WorkspacePage() {
  const { t } = useTranslation()
  const setView = useSessionStore((s) => s.setView)
  const { workspaces, selectedWorkspaceId, selectWorkspace, deleteWorkspace } = useWorkspaceStore()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b dark:border-zinc-700">
        <button
          onClick={() => setView('home')}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>
        <Users2 className="w-5 h-5" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{t('workspace.title')}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('workspace.subtitle')}</p>
        </div>
        {!selectedWorkspace && (
          <Button onClick={() => setShowCreateModal(true)} className="text-sm">
            <Plus className="w-4 h-4 mr-1" />
            {t('workspace.newWorkspace')}
          </Button>
        )}
        {selectedWorkspace && (
          <Button onClick={() => selectWorkspace(null)} className="text-sm">
            {t('workspace.backToList')}
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-auto">
        {!selectedWorkspace ? (
          // Workspace List View
          workspaces.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Users2 className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
                <p className="text-zinc-500 dark:text-zinc-400">{t('workspace.noWorkspaces')}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {workspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  onSelect={() => selectWorkspace(workspace.id)}
                  onDelete={() => {
                    if (confirm(t('workspace.deleteConfirm'))) {
                      deleteWorkspace(workspace.id)
                    }
                  }}
                />
              ))}
            </div>
          )
        ) : (
          // Workspace Detail View
          <WorkspaceDetailView workspace={selectedWorkspace} />
        )}
      </div>

      {showCreateModal && <CreateWorkspaceModal onClose={() => setShowCreateModal(false)} />}
    </div>
  )
}

interface WorkspaceCardProps {
  workspace: Workspace
  onSelect: () => void
  onDelete: () => void
}

function WorkspaceCard({ workspace, onSelect, onDelete }: WorkspaceCardProps) {
  const { t } = useTranslation()

  return (
    <div
      className="border dark:border-zinc-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-base mb-1">{workspace.name}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
            {workspace.description || t('workspace.noDescription')}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          title={t('common.delete')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-1">
          <Users2 className="w-3 h-3" />
          <span>{workspace.members.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          <span>{workspace.sharedPromptIds.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <Database className="w-3 h-3" />
          <span>{workspace.sharedKnowledgeIds.length}</span>
        </div>
      </div>
    </div>
  )
}

interface WorkspaceDetailViewProps {
  workspace: Workspace
}

function WorkspaceDetailView({ workspace }: WorkspaceDetailViewProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'members' | 'prompts' | 'knowledge' | 'activity'>('members')
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)

  return (
    <div className="flex flex-col h-full">
      {/* Workspace Header */}
      <div className="border-b dark:border-zinc-700 p-4">
        <h2 className="text-xl font-bold mb-2">{workspace.name}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
          {workspace.description || t('workspace.noDescription')}
        </p>
        <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1">
            <Users2 className="w-4 h-4" />
            <span>{t('workspace.memberCount').replace('{count}', String(workspace.members.length))}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b dark:border-zinc-700">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'members'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Users2 className="w-4 h-4 inline mr-1" />
          {t('workspace.tabs.members')}
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'prompts'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-1" />
          {t('workspace.tabs.prompts')}
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'knowledge'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Database className="w-4 h-4 inline mr-1" />
          {t('workspace.tabs.knowledge')}
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'activity'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-1" />
          {t('workspace.tabs.activity')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t('workspace.members')}</h3>
              <Button onClick={() => setShowAddMemberModal(true)} className="text-sm">
                <UserPlus className="w-4 h-4 mr-1" />
                {t('workspace.addMember')}
              </Button>
            </div>
            {workspace.members.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                {t('workspace.noMembers')}
              </div>
            ) : (
              <div className="space-y-2">
                {workspace.members.map((member) => (
                  <MemberRow key={member.id} member={member} workspaceId={workspace.id} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'prompts' && (
          <div>
            <h3 className="font-semibold mb-4">{t('workspace.sharedPrompts')}</h3>
            {workspace.sharedPromptIds.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                {t('workspace.noSharedPrompts')}
              </div>
            ) : (
              <div className="space-y-2">
                {workspace.sharedPromptIds.map((promptId) => (
                  <div
                    key={promptId}
                    className="border dark:border-zinc-700 rounded p-3 text-sm"
                  >
                    <BookOpen className="w-4 h-4 inline mr-2 text-zinc-500" />
                    {promptId}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div>
            <h3 className="font-semibold mb-4">{t('workspace.sharedKnowledge')}</h3>
            {workspace.sharedKnowledgeIds.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                {t('workspace.noSharedKnowledge')}
              </div>
            ) : (
              <div className="space-y-2">
                {workspace.sharedKnowledgeIds.map((knowledgeId) => (
                  <div
                    key={knowledgeId}
                    className="border dark:border-zinc-700 rounded p-3 text-sm"
                  >
                    <Database className="w-4 h-4 inline mr-2 text-zinc-500" />
                    {knowledgeId}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            <h3 className="font-semibold mb-4">{t('workspace.recentActivity')}</h3>
            {workspace.activities.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                {t('workspace.noActivity')}
              </div>
            ) : (
              <div className="space-y-3">
                {workspace.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="border dark:border-zinc-700 rounded p-3"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <span className="font-medium text-sm">{activity.memberName}</span>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-2">
                          {activity.action}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{activity.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddMemberModal && (
        <AddMemberModal
          workspaceId={workspace.id}
          onClose={() => setShowAddMemberModal(false)}
        />
      )}
    </div>
  )
}

interface MemberRowProps {
  member: Workspace['members'][0]
  workspaceId: string
}

function MemberRow({ member, workspaceId }: MemberRowProps) {
  const { t } = useTranslation()
  const { removeMember, updateMemberRole } = useWorkspaceStore()

  return (
    <div className="border dark:border-zinc-700 rounded p-3 flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{member.name}</span>
          <RoleBadge role={member.role} />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{member.email}</p>
      </div>
      <div className="flex gap-1">
        <select
          value={member.role}
          onChange={(e) => updateMemberRole(workspaceId, member.id, e.target.value as WorkspaceRole)}
          className="text-xs px-2 py-1 border dark:border-zinc-700 rounded dark:bg-zinc-800"
        >
          <option value="admin">{t('workspace.role.admin')}</option>
          <option value="editor">{t('workspace.role.editor')}</option>
          <option value="viewer">{t('workspace.role.viewer')}</option>
        </select>
        <button
          onClick={() => {
            if (confirm(t('workspace.removeMemberConfirm'))) {
              removeMember(workspaceId, member.id)
            }
          }}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          title={t('common.remove')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: WorkspaceRole }) {
  const { t } = useTranslation()
  const colors = {
    admin: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    editor: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    viewer: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  }

  const icons = {
    admin: Crown,
    editor: Pencil,
    viewer: Eye,
  }

  const Icon = icons[role]

  return (
    <span className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${colors[role]}`}>
      <Icon className="w-3 h-3" />
      {t(`workspace.role.${role}`)}
    </span>
  )
}

function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  function handleCreate() {
    if (!name.trim()) return
    createWorkspace(name, description)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('workspace.newWorkspace')}</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('workspace.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              placeholder={t('workspace.namePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('workspace.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              placeholder={t('workspace.descriptionPlaceholder')}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={onClose} className="bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim()}>
              {t('common.create')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddMemberModal({ workspaceId, onClose }: { workspaceId: string; onClose: () => void }) {
  const { t } = useTranslation()
  const addMember = useWorkspaceStore((s) => s.addMember)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<WorkspaceRole>('viewer')

  function handleAdd() {
    if (!name.trim() || !email.trim()) return
    addMember(workspaceId, name, email, role)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('workspace.addMember')}</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('workspace.memberName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              placeholder={t('workspace.memberNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('workspace.memberEmail')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
              placeholder={t('workspace.memberEmailPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('workspace.role.label')}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
              className="w-full px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800"
            >
              <option value="admin">{t('workspace.role.admin')}</option>
              <option value="editor">{t('workspace.role.editor')}</option>
              <option value="viewer">{t('workspace.role.viewer')}</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={onClose} className="bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAdd} disabled={!name.trim() || !email.trim()}>
              {t('workspace.addMember')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
