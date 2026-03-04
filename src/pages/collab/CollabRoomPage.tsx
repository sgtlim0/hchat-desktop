import { useState } from 'react'
import { useTranslation } from '@/shared/i18n'
import { useCollabStore } from '@/entities/collab/collab.store'
import {
  Users,
  Plus,
  Link,
  Copy,
  MessageSquare,
  Send,
  LogOut,
  Crown,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { useToastStore } from '@/entities/toast/toast.store'

export function CollabRoomPage() {
  const { t } = useTranslation()
  const {
    rooms,
    currentRoomId,
    localParticipantId,
    messages,
    createRoom,
    joinRoom,
    selectRoom,
    leaveRoom,
    sendMessage,
    setTyping,
    deleteRoom,
  } = useCollabStore()
  const addToast = useToastStore((s) => s.addToast)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [roomNameInput, setRoomNameInput] = useState('')
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [messageInput, setMessageInput] = useState('')

  const currentRoom = rooms.find((r) => r.id === currentRoomId)

  const handleCreateRoom = () => {
    if (!roomNameInput.trim()) return
    createRoom(roomNameInput.trim())
    setRoomNameInput('')
    setShowCreateModal(false)
    addToast({ type: 'success', message: t('collab.createRoom') })
  }

  const handleJoinRoom = () => {
    const code = inviteCodeInput.trim().toUpperCase()
    if (!code) return

    const room = rooms.find((r) => r.inviteCode === code)
    if (!room) {
      addToast({ type: 'error', message: t('collab.roomNotFound') })
      return
    }

    joinRoom(code)
    setInviteCodeInput('')
    setShowJoinModal(false)
    addToast({ type: 'success', message: `${t('collab.enterRoom')}: ${room.name}` })
  }

  const handleCopyInvite = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {})
    addToast({ type: 'success', message: t('collab.inviteCopied') })
  }

  const handleEnterRoom = (roomId: string) => {
    selectRoom(roomId)
  }

  const handleLeaveRoom = () => {
    if (!currentRoom) return
    leaveRoom()
    addToast({ type: 'info', message: `${t('collab.leaveRoom')}: ${currentRoom.name}` })
  }

  const handleSendMessage = () => {
    const content = messageInput.trim()
    if (!content) return
    sendMessage(content)
    setMessageInput('')
  }

  const handleMessageInputChange = (value: string) => {
    setMessageInput(value)
    if (value.trim()) {
      setTyping(true)
    } else {
      setTyping(false)
    }
  }

  const handleDeleteRoom = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId)
    if (!room) return
    deleteRoom(roomId)
    addToast({ type: 'info', message: `${t('collab.deleteRoom')}: ${room.name}` })
  }

  if (currentRoomId) {
    return (
      <div className="flex h-full flex-col bg-white dark:bg-gray-900">
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentRoom?.name}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>
                  {t('collab.participants')}: {currentRoom?.participants.length ?? 0}
                </span>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLeaveRoom}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('collab.leaveRoom')}
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r border-gray-200 p-4 dark:border-gray-700">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              {t('collab.participants')}
            </h3>
            <div className="space-y-2">
              {currentRoom?.participants.map((p) => {
                const isHost = p.id === currentRoom.hostId
                const isMe = p.id === localParticipantId
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800"
                  >
                    {isHost ? (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <UserPlus className="h-4 w-4 text-gray-400" />
                    )}
                    <div className="flex-1 truncate">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {p.name} {isMe && '(You)'}
                      </div>
                      {p.isTyping && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t('collab.typing')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    {t('collab.chatArea')}
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.participantId === localParticipantId
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md rounded-lg p-3 ${
                          isMe
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                        }`}
                      >
                        {!isMe && (
                          <div className="mb-1 text-xs font-semibold opacity-70">
                            {msg.participantName}
                          </div>
                        )}
                        <div className="text-sm">{msg.content}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => handleMessageInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder={t('collab.messagePlaceholder')}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  {t('collab.sendMessage')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      <div className="border-b border-gray-200 p-6 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('collab.title')}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('collab.desc')}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex gap-3">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('collab.createRoom')}
          </Button>
          <Button variant="secondary" onClick={() => setShowJoinModal(true)}>
            <Link className="mr-2 h-4 w-4" />
            {t('collab.joinWithCode')}
          </Button>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {t('collab.myRooms')}
          </h2>
          {rooms.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-8 text-center dark:border-gray-700">
              <Users className="mx-auto mb-3 h-12 w-12 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">{t('collab.noRooms')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => {
                const isHost = room.hostId === localParticipantId
                return (
                  <div
                    key={room.id}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-blue-500" />
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {room.name}
                          </h3>
                          {isHost && (
                            <Crown className="h-4 w-4 text-yellow-500" aria-label={t('collab.host')} />
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>
                            {t('collab.participants')}: {room.participants.length}
                          </span>
                          <span className={room.isActive ? 'text-green-500' : 'text-gray-400'}>
                            {room.isActive ? t('collab.active') : t('collab.inactive')}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>
                            {t('collab.inviteCode')}: {room.inviteCode}
                          </span>
                          <button
                            onClick={() => handleCopyInvite(room.inviteCode)}
                            className="text-blue-500 hover:text-blue-600"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleEnterRoom(room.id)}>
                          {t('collab.enterRoom')}
                        </Button>
                        {isHost && (
                          <Button
                            variant="ghost"
                            onClick={() => handleDeleteRoom(room.id)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                          >
                            {t('common.delete')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              {t('collab.createRoom')}
            </h2>
            <input
              type="text"
              value={roomNameInput}
              onChange={(e) => setRoomNameInput(e.target.value)}
              placeholder={t('collab.enterRoomName')}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateRoom()
                }
              }}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreateRoom} disabled={!roomNameInput.trim()}>
                {t('common.create')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              {t('collab.joinWithCode')}
            </h2>
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              placeholder={t('collab.enterInviteCode')}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleJoinRoom()
                }
              }}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowJoinModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleJoinRoom} disabled={!inviteCodeInput.trim()}>
                {t('collab.enterRoom')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
