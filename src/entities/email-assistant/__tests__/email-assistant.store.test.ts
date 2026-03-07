import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEmailAssistantStore } from '../email-assistant.store'
import type { EmailDraft } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllEmailDrafts: vi.fn(() => Promise.resolve([])),
  putEmailDraft: vi.fn(() => Promise.resolve()),
  deleteEmailDraftFromDb: vi.fn(() => Promise.resolve()),
}))

describe('EmailAssistantStore', () => {
  beforeEach(() => {
    useEmailAssistantStore.setState({
      drafts: [],
      selectedDraftId: null,
    })
  })

  it('should create a draft', () => {
    const { createDraft } = useEmailAssistantStore.getState()

    createDraft('Meeting Follow-up', 'john@example.com', 'formal')

    const drafts = useEmailAssistantStore.getState().drafts
    expect(drafts).toHaveLength(1)
    expect(drafts[0].subject).toBe('Meeting Follow-up')
    expect(drafts[0].recipient).toBe('john@example.com')
    expect(drafts[0].tone).toBe('formal')
    expect(drafts[0].body).toBe('')
    expect(drafts[0].isReply).toBe(false)
    expect(useEmailAssistantStore.getState().selectedDraftId).toBe(drafts[0].id)
  })

  it('should create a reply draft with original thread', () => {
    const { createDraft } = useEmailAssistantStore.getState()

    createDraft('Re: Project Update', 'alice@example.com', 'professional', true, 'Original message thread...')

    const drafts = useEmailAssistantStore.getState().drafts
    expect(drafts).toHaveLength(1)
    expect(drafts[0].isReply).toBe(true)
    expect(drafts[0].originalThread).toBe('Original message thread...')
  })

  it('should update draft body', () => {
    useEmailAssistantStore.setState({
      drafts: [
        { id: 'd-1', subject: 'Test', recipient: 'a@b.com', tone: 'casual' as const, body: '', isReply: false, createdAt: new Date().toISOString() },
      ],
    })

    const { updateBody } = useEmailAssistantStore.getState()
    updateBody('d-1', 'Hello, this is the email body.')

    expect(useEmailAssistantStore.getState().drafts[0].body).toBe('Hello, this is the email body.')
  })

  it('should delete a draft and clear selection', () => {
    useEmailAssistantStore.setState({
      drafts: [
        { id: 'd-1', subject: 'A', recipient: 'a@b.com', tone: 'formal' as const, body: '', isReply: false, createdAt: new Date().toISOString() },
        { id: 'd-2', subject: 'B', recipient: 'c@d.com', tone: 'casual' as const, body: '', isReply: false, createdAt: new Date().toISOString() },
      ],
      selectedDraftId: 'd-1',
    })

    const { deleteDraft } = useEmailAssistantStore.getState()
    deleteDraft('d-1')

    const state = useEmailAssistantStore.getState()
    expect(state.drafts).toHaveLength(1)
    expect(state.drafts[0].id).toBe('d-2')
    expect(state.selectedDraftId).toBeNull()
  })

  it('should select and deselect a draft', () => {
    const { selectDraft } = useEmailAssistantStore.getState()

    selectDraft('d-1')
    expect(useEmailAssistantStore.getState().selectedDraftId).toBe('d-1')

    selectDraft(null)
    expect(useEmailAssistantStore.getState().selectedDraftId).toBeNull()
  })

  it('should hydrate from DB', async () => {
    const mockDrafts: EmailDraft[] = [
      { id: 'd-1', subject: 'From DB', recipient: 'x@y.com', tone: 'friendly', body: 'Hi!', isReply: false, createdAt: new Date().toISOString() },
    ]

    const { getAllEmailDrafts } = await import('@/shared/lib/db')
    vi.mocked(getAllEmailDrafts).mockResolvedValueOnce(mockDrafts)

    const { hydrate } = useEmailAssistantStore.getState()
    hydrate()

    await new Promise((resolve) => setTimeout(resolve, 10))

    const drafts = useEmailAssistantStore.getState().drafts
    expect(drafts).toHaveLength(1)
    expect(drafts[0].subject).toBe('From DB')
  })
})
