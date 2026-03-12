import { describe, it, expect, beforeEach } from 'vitest'
import { useCollabStore } from '@/entities/collab/collab.store'

describe('CollabStore', () => {
  beforeEach(() => {
    // Reset store state
    useCollabStore.setState({
      rooms: [],
      currentRoomId: null,
      localParticipantId: 'participant-test-123',
      isConnected: false,
      messages: [],
    })
  })

  it('should create a new room as host', () => {
    const { createRoom } = useCollabStore.getState()

    createRoom('My Collaboration Room')

    const { rooms, currentRoomId, isConnected } = useCollabStore.getState()
    expect(rooms).toHaveLength(1)
    expect(rooms[0].name).toBe('My Collaboration Room')
    expect(rooms[0].hostId).toBe('participant-test-123')
    expect(rooms[0].participants).toHaveLength(1)
    expect(rooms[0].participants[0].role).toBe('host')
    expect(rooms[0].inviteCode).toMatch(/^[A-Z0-9]{3}-[A-Z0-9]{4}$/)
    expect(currentRoomId).toBe(rooms[0].id)
    expect(isConnected).toBe(true)
  })

  it('should join an existing room with invite code', () => {
    const { createRoom, joinRoom } = useCollabStore.getState()

    // First, create a room
    createRoom('Test Room')
    const inviteCode = useCollabStore.getState().rooms[0].inviteCode

    // Reset connection state to simulate another user
    useCollabStore.setState({
      currentRoomId: null,
      isConnected: false,
      localParticipantId: 'participant-test-456',
    })

    joinRoom(inviteCode)

    const { rooms, currentRoomId, isConnected } = useCollabStore.getState()
    expect(rooms[0].participants).toHaveLength(2)
    expect(rooms[0].participants[1].role).toBe('participant')
    expect(currentRoomId).toBe(rooms[0].id)
    expect(isConnected).toBe(true)
  })

  it('should not join with invalid invite code', () => {
    const { joinRoom } = useCollabStore.getState()

    joinRoom('INVALID-CODE')

    const { currentRoomId, isConnected } = useCollabStore.getState()
    expect(currentRoomId).toBeNull()
    expect(isConnected).toBe(false)
  })

  it('should leave a room', () => {
    const { createRoom, leaveRoom } = useCollabStore.getState()

    createRoom('Test Room')
    expect(useCollabStore.getState().isConnected).toBe(true)

    leaveRoom()

    const { currentRoomId, isConnected, messages, rooms } = useCollabStore.getState()
    expect(currentRoomId).toBeNull()
    expect(isConnected).toBe(false)
    expect(messages).toHaveLength(0)
    expect(rooms[0].participants).toHaveLength(0)
    expect(rooms[0].isActive).toBe(false)
  })

  it('should select and auto-join a room if not already joined', () => {
    const { createRoom, selectRoom } = useCollabStore.getState()

    createRoom('Room 1')
    const roomId = useCollabStore.getState().rooms[0].id

    // Simulate leaving and selecting again
    useCollabStore.setState({
      currentRoomId: null,
      isConnected: false,
      localParticipantId: 'participant-test-789',
    })

    selectRoom(roomId)

    const { currentRoomId, isConnected, rooms } = useCollabStore.getState()
    expect(currentRoomId).toBe(roomId)
    expect(isConnected).toBe(true)
    expect(rooms[0].participants.some(p => p.id === 'participant-test-789')).toBe(true)
  })

  it('should set typing status', () => {
    const { createRoom, setTyping } = useCollabStore.getState()

    createRoom('Test Room')

    setTyping(true)

    let { rooms } = useCollabStore.getState()
    const participant = rooms[0].participants.find(p => p.id === 'participant-test-123')
    expect(participant?.isTyping).toBe(true)

    setTyping(false)

    rooms = useCollabStore.getState().rooms
    const updatedParticipant = rooms[0].participants.find(p => p.id === 'participant-test-123')
    expect(updatedParticipant?.isTyping).toBe(false)
  })

  it('should send a message', () => {
    const { createRoom, sendMessage } = useCollabStore.getState()

    createRoom('Chat Room')

    sendMessage('Hello, world!')

    const { messages } = useCollabStore.getState()
    expect(messages).toHaveLength(1)
    expect(messages[0].content).toBe('Hello, world!')
    expect(messages[0].participantId).toBe('participant-test-123')
    expect(messages[0].participantName).toBe('Me')
  })

  it('should delete a room and clear state if current', () => {
    const { createRoom, deleteRoom } = useCollabStore.getState()

    createRoom('Room to Delete')
    const roomId = useCollabStore.getState().rooms[0].id

    deleteRoom(roomId)

    const { rooms, currentRoomId, isConnected, messages } = useCollabStore.getState()
    expect(rooms).toHaveLength(0)
    expect(currentRoomId).toBeNull()
    expect(isConnected).toBe(false)
    expect(messages).toHaveLength(0)
  })

  it('should maintain state when deleting non-current room', () => {
    // Use setState to avoid Date.now() collision
    useCollabStore.setState({
      rooms: [
        {
          id: 'room-1',
          name: 'Room 1',
          sessionId: '',
          hostId: 'participant-test-123',
          participants: [{ id: 'participant-test-123', name: 'Me', role: 'host', isTyping: false, lastActiveAt: '2026-01-01' }],
          inviteCode: 'AAA-BBBB',
          isActive: true,
          createdAt: '2026-01-01',
        },
        {
          id: 'room-2',
          name: 'Room 2',
          sessionId: '',
          hostId: 'participant-test-123',
          participants: [{ id: 'participant-test-123', name: 'Me', role: 'host', isTyping: false, lastActiveAt: '2026-01-02' }],
          inviteCode: 'CCC-DDDD',
          isActive: true,
          createdAt: '2026-01-02',
        },
      ],
      currentRoomId: 'room-2',
      isConnected: true,
    })

    useCollabStore.getState().deleteRoom('room-1')

    const { rooms, currentRoomId, isConnected } = useCollabStore.getState()
    expect(rooms).toHaveLength(1)
    expect(rooms[0].id).toBe('room-2')
    expect(currentRoomId).toBe('room-2')
    expect(isConnected).toBe(true)
  })

  it('should handle multiple participants and messages', () => {
    const { createRoom, sendMessage } = useCollabStore.getState()

    createRoom('Multi User Room')
    const room = useCollabStore.getState().rooms[0]

    // Simulate second participant already joined (via setState to avoid joinRoom resetting messages)
    useCollabStore.setState({
      rooms: [
        {
          ...room,
          participants: [
            ...room.participants,
            { id: 'participant-test-999', name: 'Guest', role: 'participant', isTyping: false, lastActiveAt: new Date().toISOString() },
          ],
        },
      ],
    })

    // First participant sends message
    sendMessage('Message from host')

    // Switch to second participant and send message
    useCollabStore.setState({ localParticipantId: 'participant-test-999' })
    sendMessage('Message from participant')

    const { messages, rooms: updatedRooms } = useCollabStore.getState()
    expect(messages).toHaveLength(2)
    expect(messages[0].participantId).toBe('participant-test-123')
    expect(messages[1].participantId).toBe('participant-test-999')
    expect(updatedRooms[0].participants).toHaveLength(2)
  })
})