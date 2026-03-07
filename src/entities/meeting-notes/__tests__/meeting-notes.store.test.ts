import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMeetingNotesStore } from '../meeting-notes.store'

vi.mock('@/shared/lib/db', () => ({
  getAllMeetingNotes: vi.fn().mockResolvedValue([]),
  putMeetingNote: vi.fn().mockResolvedValue(undefined),
  deleteMeetingNoteFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('MeetingNotesStore', () => {
  beforeEach(() => { useMeetingNotesStore.setState({ notes: [] }) })

  it('should have empty initial state', () => {
    expect(useMeetingNotesStore.getState().notes).toEqual([])
  })

  it('should create a note', async () => {
    await useMeetingNotesStore.getState().createNote('Standup', 'standup')
    const notes = useMeetingNotesStore.getState().notes
    expect(notes).toHaveLength(1)
    expect(notes[0].title).toBe('Standup')
    expect(notes[0].template).toBe('standup')
    expect(notes[0].actionItems).toEqual([])
    expect(notes[0].participants).toEqual([])
  })

  it('should delete a note', async () => {
    await useMeetingNotesStore.getState().createNote('A', 'standup')
    const id = useMeetingNotesStore.getState().notes[0].id
    await useMeetingNotesStore.getState().deleteNote(id)
    expect(useMeetingNotesStore.getState().notes).toHaveLength(0)
  })

  it('should update content', async () => {
    await useMeetingNotesStore.getState().createNote('B', 'brainstorm')
    const id = useMeetingNotesStore.getState().notes[0].id
    await useMeetingNotesStore.getState().updateContent(id, 'New content')
    expect(useMeetingNotesStore.getState().notes[0].content).toBe('New content')
  })

  it('should add and toggle action items', async () => {
    await useMeetingNotesStore.getState().createNote('C', 'decision')
    const id = useMeetingNotesStore.getState().notes[0].id
    await useMeetingNotesStore.getState().addActionItem(id, { text: 'Fix bug', assignee: 'Alice' })
    const items = useMeetingNotesStore.getState().notes[0].actionItems
    expect(items).toHaveLength(1)
    expect(items[0].done).toBe(false)

    await useMeetingNotesStore.getState().toggleActionItem(id, items[0].id)
    expect(useMeetingNotesStore.getState().notes[0].actionItems[0].done).toBe(true)
  })

  it('should add a participant', async () => {
    await useMeetingNotesStore.getState().createNote('D', 'standup')
    const id = useMeetingNotesStore.getState().notes[0].id
    await useMeetingNotesStore.getState().addParticipant(id, 'Bob')
    expect(useMeetingNotesStore.getState().notes[0].participants).toEqual(['Bob'])
  })

  it('should not add duplicate participant', async () => {
    await useMeetingNotesStore.getState().createNote('E', 'standup')
    const id = useMeetingNotesStore.getState().notes[0].id
    await useMeetingNotesStore.getState().addParticipant(id, 'Bob')
    await useMeetingNotesStore.getState().addParticipant(id, 'Bob')
    expect(useMeetingNotesStore.getState().notes[0].participants).toEqual(['Bob'])
  })

  it('should remove a participant', async () => {
    await useMeetingNotesStore.getState().createNote('F', 'retrospective')
    const id = useMeetingNotesStore.getState().notes[0].id
    await useMeetingNotesStore.getState().addParticipant(id, 'Alice')
    await useMeetingNotesStore.getState().addParticipant(id, 'Bob')
    await useMeetingNotesStore.getState().removeParticipant(id, 'Alice')
    expect(useMeetingNotesStore.getState().notes[0].participants).toEqual(['Bob'])
  })
})
