import { create } from 'zustand'
import type { CollabRoom, CollabParticipant } from '@/shared/types'

interface CollabMessage {
  id: string
  participantId: string
  participantName: string
  content: string
  timestamp: string
}

interface CollabState {
  rooms: CollabRoom[]
  currentRoomId: string | null
  localParticipantId: string
  isConnected: boolean
  messages: CollabMessage[]

  // Actions
  createRoom: (name: string) => void
  joinRoom: (inviteCode: string) => void
  leaveRoom: () => void
  selectRoom: (roomId: string | null) => void
  setTyping: (isTyping: boolean) => void
  sendMessage: (content: string) => void
  deleteRoom: (roomId: string) => void
  hydrate: () => Promise<void>
}

const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${part1}-${part2}`
}

const generateParticipantId = (): string => {
  return `participant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const useCollabStore = create<CollabState>((set, get) => ({
  rooms: [],
  currentRoomId: null,
  localParticipantId: generateParticipantId(),
  isConnected: false,
  messages: [],

  hydrate: async () => {
    // No-op: local simulation only
  },

  createRoom: (name) => {
    const state = get()
    const now = new Date().toISOString()
    const roomId = `room-${Date.now()}`
    const inviteCode = generateInviteCode()

    const localParticipant: CollabParticipant = {
      id: state.localParticipantId,
      name: 'Me',
      role: 'host',
      isTyping: false,
      lastActiveAt: now,
    }

    const newRoom: CollabRoom = {
      id: roomId,
      name,
      sessionId: '',
      hostId: state.localParticipantId,
      participants: [localParticipant],
      inviteCode,
      isActive: true,
      createdAt: now,
    }

    set((s) => ({
      rooms: [...s.rooms, newRoom],
      currentRoomId: roomId,
      isConnected: true,
      messages: [],
    }))
  },

  joinRoom: (inviteCode) => {
    const state = get()
    const room = state.rooms.find((r) => r.inviteCode === inviteCode)

    if (!room) {
      return
    }

    const now = new Date().toISOString()
    const localParticipant: CollabParticipant = {
      id: state.localParticipantId,
      name: 'Me',
      role: 'participant',
      isTyping: false,
      lastActiveAt: now,
    }

    const updatedRoom: CollabRoom = {
      ...room,
      participants: [...room.participants, localParticipant],
    }

    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === room.id ? updatedRoom : r)),
      currentRoomId: room.id,
      isConnected: true,
      messages: [],
    }))
  },

  leaveRoom: () => {
    const state = get()
    if (!state.currentRoomId) return

    const room = state.rooms.find((r) => r.id === state.currentRoomId)
    if (!room) return

    const updatedParticipants = room.participants.filter(
      (p) => p.id !== state.localParticipantId
    )

    const updatedRoom: CollabRoom = {
      ...room,
      participants: updatedParticipants,
      isActive: updatedParticipants.length > 0,
    }

    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === room.id ? updatedRoom : r)),
      currentRoomId: null,
      isConnected: false,
      messages: [],
    }))
  },

  selectRoom: (roomId) => {
    if (roomId === null) {
      set({
        currentRoomId: null,
        isConnected: false,
        messages: [],
      })
      return
    }

    const state = get()
    const room = state.rooms.find((r) => r.id === roomId)
    if (!room) return

    const isJoined = room.participants.some(
      (p) => p.id === state.localParticipantId
    )

    if (!isJoined) {
      const now = new Date().toISOString()
      const localParticipant: CollabParticipant = {
        id: state.localParticipantId,
        name: 'Me',
        role: 'participant',
        isTyping: false,
        lastActiveAt: now,
      }

      const updatedRoom: CollabRoom = {
        ...room,
        participants: [...room.participants, localParticipant],
      }

      set((s) => ({
        rooms: s.rooms.map((r) => (r.id === room.id ? updatedRoom : r)),
        currentRoomId: roomId,
        isConnected: true,
        messages: [],
      }))
    } else {
      set({
        currentRoomId: roomId,
        isConnected: true,
        messages: [],
      })
    }
  },

  setTyping: (isTyping) => {
    const state = get()
    if (!state.currentRoomId) return

    const room = state.rooms.find((r) => r.id === state.currentRoomId)
    if (!room) return

    const now = new Date().toISOString()
    const updatedParticipants = room.participants.map((p) =>
      p.id === state.localParticipantId
        ? { ...p, isTyping, lastActiveAt: now }
        : p
    )

    const updatedRoom: CollabRoom = {
      ...room,
      participants: updatedParticipants,
    }

    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === room.id ? updatedRoom : r)),
    }))
  },

  sendMessage: (content) => {
    const state = get()
    if (!state.currentRoomId) return

    const room = state.rooms.find((r) => r.id === state.currentRoomId)
    if (!room) return

    const now = new Date().toISOString()
    const localParticipant = room.participants.find(
      (p) => p.id === state.localParticipantId
    )

    if (!localParticipant) return

    const newMessage: CollabMessage = {
      id: `msg-${Date.now()}`,
      participantId: state.localParticipantId,
      participantName: localParticipant.name,
      content,
      timestamp: now,
    }

    set((s) => ({
      messages: [...s.messages, newMessage],
    }))

    get().setTyping(false)
  },

  deleteRoom: (roomId) => {
    set((s) => {
      const newState: Partial<CollabState> = {
        rooms: s.rooms.filter((r) => r.id !== roomId),
      }

      if (s.currentRoomId === roomId) {
        newState.currentRoomId = null
        newState.isConnected = false
        newState.messages = []
      }

      return newState
    })
  },
}))
