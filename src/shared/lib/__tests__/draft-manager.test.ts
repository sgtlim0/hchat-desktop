import { describe, it, expect, beforeEach } from 'vitest'
import { saveDraft, getDraft, deleteDraft, getAllDrafts, clearAllDrafts } from '../draft-manager'

describe('draft-manager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and retrieves a draft', () => {
    saveDraft('sess-1', 'Hello world')
    const draft = getDraft('sess-1')
    expect(draft).not.toBeNull()
    expect(draft!.content).toBe('Hello world')
    expect(draft!.sessionId).toBe('sess-1')
  })

  it('returns null for non-existent draft', () => {
    expect(getDraft('nonexistent')).toBeNull()
  })

  it('overwrites existing draft', () => {
    saveDraft('sess-1', 'First')
    saveDraft('sess-1', 'Second')
    expect(getDraft('sess-1')!.content).toBe('Second')
  })

  it('deletes a draft', () => {
    saveDraft('sess-1', 'Hello')
    deleteDraft('sess-1')
    expect(getDraft('sess-1')).toBeNull()
  })

  it('deletes draft when saving empty content', () => {
    saveDraft('sess-1', 'Hello')
    saveDraft('sess-1', '')
    expect(getDraft('sess-1')).toBeNull()
  })

  it('deletes draft when saving whitespace-only', () => {
    saveDraft('sess-1', 'Hello')
    saveDraft('sess-1', '   ')
    expect(getDraft('sess-1')).toBeNull()
  })

  it('returns all drafts sorted by updatedAt', () => {
    saveDraft('sess-1', 'First')
    saveDraft('sess-2', 'Second')
    saveDraft('sess-3', 'Third')
    const all = getAllDrafts()
    expect(all).toHaveLength(3)
    expect(all[0].sessionId).toBe('sess-3')
  })

  it('clears all drafts', () => {
    saveDraft('sess-1', 'A')
    saveDraft('sess-2', 'B')
    clearAllDrafts()
    expect(getAllDrafts()).toHaveLength(0)
  })

  it('limits to 50 drafts max', () => {
    for (let i = 0; i < 60; i++) {
      saveDraft(`sess-${i}`, `Draft ${i}`)
    }
    expect(getAllDrafts().length).toBeLessThanOrEqual(50)
  })

  it('stores updatedAt timestamp', () => {
    saveDraft('sess-1', 'Test')
    const draft = getDraft('sess-1')
    expect(draft!.updatedAt).toBeTruthy()
    expect(new Date(draft!.updatedAt).getTime()).toBeGreaterThan(0)
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('hchat-drafts', 'invalid json')
    expect(getDraft('sess-1')).toBeNull()
    expect(getAllDrafts()).toHaveLength(0)
  })

  it('multiple sessions are independent', () => {
    saveDraft('sess-1', 'A')
    saveDraft('sess-2', 'B')
    deleteDraft('sess-1')
    expect(getDraft('sess-1')).toBeNull()
    expect(getDraft('sess-2')!.content).toBe('B')
  })
})
